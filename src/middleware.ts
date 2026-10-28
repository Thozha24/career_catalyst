import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify, type JWTPayload } from "jose";

/**
 * Edge middleware: first line of defense (UX-level route protection).
 * Real authorization is always re-verified server-side in pages/API routes.
 */

const SESSION_COOKIE = "cc_session";

function getSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? "");
}

async function readSession(req: NextRequest): Promise<{ role: string } | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  // Cookie format is `<jwt>.<rawToken>` (lib/auth.ts) — only the JWT part verifies
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;
  try {
    const { payload } = await jwtVerify(token.slice(0, lastDot), getSecret());
    const p = payload as JWTPayload & { role?: string };
    if (!p.sub || !p.role) return null;
    return { role: p.role };
  } catch {
    return null;
  }
}

function homeForRole(role: string): string {
  if (role === "MENTOR") return "/mentor/dashboard";
  if (role === "ADMIN") return "/admin/dashboard";
  return "/student/dashboard";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await readSession(req);

  const isAuthPage = pathname === "/signin" || pathname === "/signup" || pathname === "/forgot-password";

  // Signed-in users shouldn't see auth pages
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL(homeForRole(session.role), req.url));
  }

  const protectedPrefix = ["/student", "/mentor", "/admin", "/dashboard"].find(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (protectedPrefix) {
    if (!session) {
      const url = new URL("/signin", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    const requiredRole = protectedPrefix.slice(1).toUpperCase(); // student→STUDENT etc. (dashboard handled server-side)
    if (protectedPrefix !== "/dashboard" && session.role !== requiredRole) {
      return NextResponse.redirect(new URL(homeForRole(session.role), req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml)$).*)"],
};
