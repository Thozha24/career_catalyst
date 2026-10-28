# Security documentation

## Defense philosophy

The browser is **never trusted**. Every mutation re-resolves the session, parses input through Zod, and re-derives authorization server-side. Frontend route protection (middleware + role redirects) is UX; server guards (`src/lib/guards.ts`) are the enforcement layer.

## Authorization matrix

| Capability | Student | Mentor | Admin |
|---|---|---|---|
| Own profile / settings / password | ✔ | ✔ | ✔ |
| Join/leave own groups, read group content | ✔ (member) | ✔ (owner) | ✔ |
| Take tests, submit coding & tasks | ✔ (own attempts) | — | — |
| Change own points | ❌ (never) | ❌ | ❌ (points come only from validated events) |
| Change any test score / attempt row directly | ❌ | ❌ (regrade path only) | ❌ |
| Create groups/tests/tasks, review submissions | — | ✔ (own groups only) | ✔ |
| View a student's data | — | ✔ only if student is in a group the mentor owns (`mentorCanAccessStudent`) | ✔ |
| Suspend/reactivate/role changes, audit logs | — | — | ✔ (not on self) |

Every mentor action re-checks `isGroupMentor(userId, groupId)`; every student action re-checks ownership by `userId` derived **from the session**, never from client IDs (prevents IDOR/BOLA).

## Threat coverage

| Threat | Mitigation |
|---|---|
| SQL injection | Prisma parameterized queries only; no string-built SQL |
| XSS | React auto-escaping; no `dangerouslySetInnerHTML` for user content |
| CSRF | Server Actions same-origin enforcement; session cookie SameSite=Lax |
| IDOR / BOLA | Ownership re-checks on every read/write (attempt, submission, notification, group) |
| Privilege escalation | Role from signed session payload + DB; role changes only via audited admin action; admins cannot self-modify |
| Session attacks | HttpOnly/SameSite/Secure cookies, DB-backed revocation, suspension kills sessions instantly, 7-day expiry |
| Brute force | Per-account+IP exponential lockout + fixed-window rate limits |
| Point forging | All points flow through `awardPoints()` (>0, ≤1000/transaction) inside a transaction with an immutable ledger row — client-sent values are rejected/ignored |
| Test tampering | Autosave API verifies the attempt belongs to the caller; grading reads stored questions/options server-side; submitted attempts are immutable except the manual-grade path |
| Code execution (RCE) | Student code is **never executed on the app server**: dev uses a pattern-simulating evaluator; prod forwards to an isolated runner (CPU/mem/network/fs/time-limited one-shot containers) |
| Enforcement uploads | Profile images are URL-only in this build; file-upload endpoints enforce MIME allowlists, size caps, random filenames, private storage + signed URLs when S3 is configured |
| Abuse of forms | Zod length/shape caps on every field; pagination caps; notifications/emails fanned out server-side with rate limits |
| Info leaks | Correct-option flags and hidden test cases never serialized to students; error pages replace stack traces; audit logs admin-only |

## Audit logging (`src/lib/audit.ts`)

Security-sensitive actions are written to `AuditLog` with actor, action, resource, resource id, metadata JSON, IP and user-agent:
login/logout, password change/reset, registration, test/test-assignment creation, task creation/review, point awards, role changes, suspensions, announcements, mentor feedback, profile visibility changes. Data history is append-only; the viewer is `/admin/audit-logs` (admin-only, paginated, filterable).

## Secrets handling

All secrets come from env (`docs/deployment.md`), `.env*` files are git-ignored and `.env.example` documents variables without values; JWT_SECRET must be ≥32 chars and rotates with a forced-relogin (all sessions die). No secret is ever referenced in client components; `server-only` markers keep server modules out of client bundles.

## What security review found (and what we fixed)

- Fibonacci auto-grading was off-by-one relative to the advertised F(1)=0 definition — fixed in evaluator and seed starter code.
- `createMany` `skipDuplicates` unsupported on SQLite in the achievement unlocker — removed (unique key + catch keeps idempotency).
- Admin user controls split into two intentional forms so a suspend click can never silently rewrite a role.
