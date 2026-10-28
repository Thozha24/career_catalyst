# API design

Career Catalyst uses **Next.js Server Actions** for UI mutations (type-safe, CSRF-resistant by origin check) plus a small set of strictly-guarded **route handlers** under `/src/app/api` for client-side non-navigational calls. Everything funnels through the same guards, validation schemas and response helpers in `src/lib/api.ts`.

## Surface

| Group | Entry points | Guard | Notes |
|---|---|---|---|
| `/auth` | server actions in `app/actions/auth.ts` | public + rate limited | registerStudent/Mentor, signIn, signOut, forgotPassword, resetPassword, changePassword |
| `/users` | `changePassword`, profile actions | session | own-account only |
| `/students /mentors` | profile update actions | session + role | role flips rejected |
| `/courses /lessons /progress` | `app/actions/learning.ts` | `requireStudent` | lesson completion (idempotent, points) + quiz scoring |
| `/coding` | `api/coding/run`, `api/coding/submit` | `getApiRoleUser` + rate limit | run = public cases only, no persistence; submit = full grading, points once |
| `/tests /test-attempts` | `api/tests/autosave`, `api/tests/submit` + `app/actions/tests.ts` | `getApiUser`, ownership checks | autosave keyed to attempt owner; submit triggers server-side grading |
| `/tasks` | `app/actions/tasks.ts` | student/mentor guards | submit (student, own tasks), review (mentor, own group) |
| `/groups` | `app/actions/groups.ts` | mentor owner / student joiner | create, join by code (rate limited), rotate invite, announcements, feedback |
| `/admin` | `app/actions/admin.ts` + `/admin/*` pages | `requireAdmin` | role change + suspend/reactivate, self-targeting blocked |
| `/notifications` | `api/notifications/read` | `getApiUser` | mark-read of own notifications only |
| health | `api/health` | public | liveness probe, no secrets |

## Conventions

- **Responses** — `ok(data)` and `fail(message, status, code)` in `lib/api.ts`; `handle()` centralizes error mapping. Validation failures → `422 VALIDATION_ERROR`; unauth → `401 UNAUTHORIZED`; wrong role → `403 FORBIDDEN`; missing → `404 NOT_FOUND`; lockouts → `429` with retry hint.
- **Validation** — every payload parses through a Zod schema in `src/lib/validation.ts` *before* any Prisma call. Unknown fields are stripped.
- **Authorization** — every protected handler resolves the session itself (` guards.ts`); role checks are enforced server-side, never presumed from the URL. Mentors only reach groups they own / students inside those groups (`isGroupMentor`, `mentorCanAccessStudent`).
- **Pagination & filtering** — list pages cap `take` (≤100–200) and order by indexed `createdAt`/points columns; mentors' student lists filter by group/skill/status.
- **Rate limiting** — `limitOrThrow()` fixed windows in memory with the same API as the production Redis-backed limiter: registration 10/h/IP, code-run 30/min/user, announcements 30/h, admin ops 60/min.
- **Idempotency** — points events and group joins are keyed by unique constraints or existence checks so double-clicks/duplicate submissions cannot double-award.
- **Errors shown to users** are friendly strings; raw Prisma/Node errors never reach the client (caught in `handle()` and logged server-side with request ids).
