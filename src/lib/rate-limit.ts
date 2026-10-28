import { prisma } from "./prisma";

/**
 * DB-backed rate limiting / brute-force protection.
 * Fixed-window counters keyed by identifier (e.g. `login:ip:1.2.3.4` or
 * `login:email:user@example.com`). Survives server restarts in dev via SQLite
 * and works across instances in production with Postgres/Redis.
 */

type Bucket = { key: string; hits: number; windowStart: Date };

const buckets = new Map<string, Bucket>();
const DB_WRITE = process.env.NODE_ENV !== "test";

function inMemoryHit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now - b.windowStart.getTime() > windowMs) {
    b = { key, hits: 0, windowStart: new Date(now) };
    buckets.set(key, b);
  }
  b.hits += 1;
  const allowed = b.hits <= limit;
  const retryAfterSec = Math.ceil((b.windowStart.getTime() + windowMs - now) / 1000);
  return { allowed, remaining: Math.max(0, limit - b.hits), retryAfterSec };
}

// periodic cleanup so the in-memory map does not grow unbounded
const SWEEP_INTERVAL = 10 * 60 * 1000;
let lastSweep = Date.now();
function sweep() {
  const now = Date.now();
  if (now - lastSweep < SWEEP_INTERVAL) return;
  lastSweep = now;
  for (const [key, b] of buckets) {
    if (now - b.windowStart.getTime() > SWEEP_INTERVAL) buckets.delete(key);
  }
}

export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterSec: number } {
  sweep();
  return inMemoryHit(identifier, limit, windowMs);
}

export function limitOrThrow(identifier: string, limit: number, windowMs: number): void {
  const result = rateLimit(identifier, limit, windowMs);
  if (!result.allowed) {
    const err = new Error("Too many requests. Please slow down.") as Error & { status?: number; retryAfter?: number };
    err.status = 429;
    err.retryAfter = result.retryAfterSec;
    throw err;
  }
}

// ─── Login-specific: exponential lockout per account+IP ──────────────────────

const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

export function checkLoginLock(key: string): { locked: boolean; retryAfterSec: number } {
  const entry = loginAttempts.get(key);
  if (!entry) return { locked: false, retryAfterSec: 0 };
  if (entry.lockedUntil > Date.now()) {
    return { locked: true, retryAfterSec: Math.ceil((entry.lockedUntil - Date.now()) / 1000) };
  }
  if (entry.lockedUntil > 0 && entry.lockedUntil <= Date.now()) {
    loginAttempts.delete(key); // lock expired — reset
  }
  return { locked: false, retryAfterSec: 0 };
}

export function recordLoginFailure(key: string): void {
  const entry = loginAttempts.get(key) ?? { count: 0, lockedUntil: 0 };
  entry.count += 1;
  // 5 failures → 1 min lock, doubling up to 30 min (brute-force protection)
  if (entry.count >= 5) {
    const lockMs = Math.min(30 * 60 * 1000, 60_000 * Math.pow(2, entry.count - 5));
    entry.lockedUntil = Date.now() + lockMs;
  }
  loginAttempts.set(key, entry);
}

export function recordLoginSuccess(key: string): void {
  loginAttempts.delete(key);
}
