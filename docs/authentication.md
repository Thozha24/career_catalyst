# Authentication & sessions

## Password storage

- Hashed with **bcrypt (cost 12)** at registration/reset (`hashPassword()` in `src/lib/auth.ts`). Password policies (min 8, letters + numbers, ≤128) enforced by `passwordSchema`, server-side.
- Plaintext is never stored, logged or returned by any API (responses contain only the user's public fields). Salts are per-hash.

## Sessions (JWT + DB, dual token)

1. On sign-in the server mints a random 32-byte `rawToken`, persists `sha256(rawToken)` in a `Session` row (holder: userId, IP, UA, expiry) and signs a short **HS256 JWT** containing `{sub: userId, sid: sessionId, role, email}`.
2. The client receives one **HttpOnly, SameSite=Lax cookie** (`cc_session`, 7-day expiry): `<jwt>.<rawToken>`. `secure` is on in production. Nothing auth-related is stored in localStorage.
3. On every request `getSessionUser()` (a) verifies the JWT signature+expiry, (b) checks the DB session exists, is un-revoked and un-expired, and (c) matches the cookie's raw token to the stored **hash**. Compromise of a token without the DB row is useless; DB revocation (logout, suspension) is instant even before the JWT expires.
4. Suspended/deleted users fail validation even with a valid session. Sign-out deletes the cookie **and marks the DB row revoked** — a stolen session token cannot be replayed after logout.

The middleware (`src/middleware.ts`) performs cheap JWT verification for routing UX; the authoritative check is always `getSessionUser()` in guards/actions. Registering the same email twice returns a deliberate ambiguous error (no user enumeration).

## Registration rules

- One primary role per account (STUDENT | MENTOR), selected at signup. **ADMIN can never self-register** — admins are provisioned (see admin-bootstrap.md).
- Unique email enforced by the DB (`User.email @unique`) and re-checked in the action.
- Rate limit: 10 registrations/hour/IP; login attempts: exponential lockout (see below).

## Password reset & email verification

- `forgotPassword` issues an opaque 32-byte token; only `sha256(raw)` is stored (`PasswordResetToken`), single-use with 1h expiry, delivered by email in production. Reset consumes the token, rehashes the password, revokes all existing sessions, and writes an audit entry. In dev without SMTP the raw token is logged server-side for testing.
- New accounts start `PENDING_VERIFICATION` with an `EmailVerificationToken`; dev provides the verify link in server logs. Unverified accounts can sign in but cannot unlock mentor capabilities that require it (configurable strictness).
- Same flow used for `changePassword` from Settings (requires current password).

## Brute-force protection

- `checkLoginLock/recordLoginFailure/recordLoginSuccess` implement per `email+ip` counters with **exponential lockout**: 5 failures → 1 minute, doubling to a max 30 minutes; a successful login clears the count. Failures are generic ("invalid credentials") to avoid account enumeration.
- Fixed-window rate limits guard register/forgot/reset/announce endpoints (`src/lib/rate-limit.ts`, swap the in-memory store for Redis in multi-instance deploys).

## Logout

`signOut` server action → `destroySession()` → JWT decoded, **DB session row `revokedAt` set**, cookie deleted, audit log entry `LOGOUT`.

## Audit entries

`LOGIN_SUCCESS / LOGIN_FAILED / LOGOUT / PASSWORD_CHANGED / PASSWORD_RESET_REQUESTED / PASSWORD_RESET_COMPLETED / ACCOUNT_SUSPENDED / ACCOUNT_REACTIVATED / ROLE_CHANGED` record actor, IP, user-agent and timestamp; ordinary users can never read `/admin/audit-logs`.
