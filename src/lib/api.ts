import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Consistent API response envelope + centralized error handling.
 * Raw backend errors are never leaked to clients.
 */

export type ApiError = { error: { message: string; code?: string; details?: unknown } };
export type ApiSuccess<T> = { data: T };

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ data }, { status: 200, ...init });
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json({ data }, { status: 201 });
}

export function fail(message: string, status = 400, code?: string, details?: unknown): NextResponse {
  return NextResponse.json({ error: { message, code, details } }, { status });
}

export const unauthorized = (msg = "You must be signed in.") => fail(msg, 401, "UNAUTHORIZED");
export const forbidden = (msg = "You do not have permission to do that.") => fail(msg, 403, "FORBIDDEN");
export const notFound = (msg = "Not found.") => fail(msg, 404, "NOT_FOUND");

/** Wrap a route handler — converts thrown errors into clean API responses. */
export async function handle(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ZodError) {
      const details = err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
      return fail("Validation failed.", 422, "VALIDATION_ERROR", details);
    }
    const e = err as Error & { status?: number; retryAfter?: number; code?: string };
    if (e.status === 429) {
      return NextResponse.json(
        { error: { message: e.message || "Too many requests.", code: "RATE_LIMITED" } },
        { status: 429, headers: e.retryAfter ? { "Retry-After": String(e.retryAfter) } : undefined }
      );
    }
    if (e.status && e.status >= 400 && e.status < 500) {
      return fail(e.message, e.status, e.code);
    }
    // Prisma known errors → friendly messages, no internals leaked
    const anyErr = err as { code?: string };
    if (anyErr.code === "P2002") return fail("That value already exists.", 409, "CONFLICT");
    if (anyErr.code === "P2025") return notFound();

    console.error("[api] unhandled error:", err);
    return fail("Something went wrong on our side. Please try again.", 500, "INTERNAL_ERROR");
  }
}

/** Parse a JSON body safely. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw Object.assign(new Error("Invalid JSON body."), { status: 400 });
  }
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

// Pagination helpers
export function parsePagination(url: URL): { page: number; pageSize: number; skip: number; take: number } {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 20) || 20));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
