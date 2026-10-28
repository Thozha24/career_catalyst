# Testing

## Run everything

```bash
npm test          # Jest unit suites (jest --runInBand --silent)
npm run typecheck # tsc --noEmit — clean as of the latest change
npm run build     # production build check
```

Config: `jest.config.mjs` (node environment, ts-jest, `@/` alias). `jest.setup.ts` stubs the Prisma layer (`@/lib/prisma` → inert object), `server-only`, `next/headers`, and pins a test JWT secret — unit suites exercise pure rules only, never the live database.

## Suites (`src/lib/*.test.ts`)

| Suite | What it locks down |
|---|---|
| `validation.test.ts` | Zod schemas: password policy, email normalization, registration mismatch, test duration/window/passingScore bounds, task point caps, submission content min, admin enum safety, CSV skill lists |
| `auth.test.ts` | bcrypt hashing (never stores plaintext, unique salts, wrong-password rejection), opaque reset-token generation & sha256 matching |
| `points.test.ts` | The anti-forgery core: negative/zero/NaN/infinity rejected, fractional points rejected, single-event cap (≤1000) blocks forged payloads |
| `scoring.test.ts` | The grading engine: MCQ/TRUE_FALSE exact-match, MULTI_SELECT no partial credit, SHORT_ANSWER normalization, CODING flagged for manual grading, negative marking (per-question, blank answers exempt, total clamps at 0), pass threshold |
| `rate-limit.test.ts` | Fixed-window limiter (allow→block, per-key isolation, 429 error), login lockout (5-failure exponential escalation, clears on success, other accounts unaffected) |
| `code-runner.test.ts` | Dev evaluator: unknown code fails safely (never executed), sum/fizzbuzz/palindrome/fibonacci recognized, partial pass → WRONG_ANSWER, hidden-case flags preserved |

## Manual integration checklist (covered flows)

Database-backed flows are verified through the running app (dev DB seeded by `npm run db:seed`):

- **Student journey**: register → sign in → dashboard stats render → join group (`cc-frontend-2026`) → complete lesson (+10) → solve problem (+20, verdict persisted) → take test (autosave, timer, submit → server scoring, points) → achievements → task submit → mentor feedback → leaderboard.
- **Mentor journey**: register → create group → rotate invite → build test (5 question types) → build task → open student analytics → review submission → award points → grade panel → announcement fans out.
- **Admin**: dashboard analytics → users search/filter → role change + suspend (sessions revoked) → groups overview → audit log pagination.
- **Security boundaries to keep testing**: wrong-role URL access redirects home; students can't mutate another student's points (API returns 401/403); mentors can't open another mentor's group; submitted attempts frozen; suspension revokes live sessions.

## Continuous integration

Wire `npm run typecheck && npm test && npm run build` into CI as the merge gate; add the manual checklist above to the release notes for migrations/schema changes.
