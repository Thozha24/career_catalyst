import "server-only";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

// ─── Password hashing (bcrypt, cost 12) ──────────────────────────────────────
// Never store or log plaintext passwords.

const BCRYPT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ─── JWT session tokens (signed, HttpOnly cookie + DB-backed session) ───────

const SESSION_COOKIE = "cc_session";
const SESSION_TTL_HOURS = 24 * 7;

export type SessionPayload = {
  sub: string;
  sid: string;
  role: "STUDENT" | "MENTOR" | "ADMIN";
  email: string;
};

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set to at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function createSession(
  userId: string,
  role: "STUDENT" | "MENTOR" | "ADMIN",
  email: string,
  meta?: { ip?: string; userAgent?: string }
): Promise<void> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600 * 1000);

  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash: sha256(rawToken),
      expiresAt,
      ip: meta?.ip ?? null,
      userAgent: meta?.userAgent?.slice(0, 300) ?? null,
    },
  });

  const jwt = await new SignJWT({ sub: userId, sid: session.id, role, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, `${jwt}.${rawToken}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: "STUDENT" | "MENTOR" | "ADMIN";
  status: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  sessionId: string;
};

export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(SESSION_COOKIE)?.value;
    if (!cookieValue) return null;

    const lastDot = cookieValue.lastIndexOf(".");
    if (lastDot === -1) return null;
    const jwt = cookieValue.slice(0, lastDot);
    const rawToken = cookieValue.slice(lastDot + 1);

    let payload: SessionPayload;
    try {
      const { payload: verified } = await jwtVerify(jwt, getSecret());
      payload = verified as unknown as SessionPayload;
    } catch {
      return null; // expired or tampered JWT
    }

    // DB-backed validation: session must exist, be un-revoked and un-expired
    const session = await prisma.session.findUnique({
      where: { id: payload.sid },
      select: { id: true, userId: true, tokenHash: true, expiresAt: true, revokedAt: true },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
    if (session.tokenHash !== sha256(rawToken)) return null;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        avatarUrl: true,
        emailVerified: true,
        deletedAt: true,
      },
    });
    if (!user || user.deletedAt || user.status === "SUSPENDED") return null;

    // Touch last-seen opportunistically
    prisma.session
      .update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
      .catch(() => undefined);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      sessionId: session.id,
    };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(SESSION_COOKIE)?.value;
  if (cookieValue) {
    const lastDot = cookieValue.lastIndexOf(".");
    if (lastDot !== -1) {
      const jwt = cookieValue.slice(0, lastDot);
      try {
        const { payload } = await jwtVerify(jwt, getSecret());
        const sid = (payload as unknown as SessionPayload).sid;
        if (sid) {
          // Invalidate server-side so the token can never be replayed
          await prisma.session.update({
            where: { id: sid },
            data: { revokedAt: new Date() },
          });
        }
      } catch {
        // token already invalid — nothing to revoke
      }
    }
  }
  cookieStore.delete(SESSION_COOKIE);
}

// ─── Opaque tokens (password reset / email verification) ────────────────────

export function generateOpaqueToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString("hex");
  return { raw, hash: sha256(raw) };
}

export function hashToken(raw: string): string {
  return sha256(raw);
}

export { SESSION_COOKIE };
