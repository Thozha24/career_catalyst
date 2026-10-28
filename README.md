# Career Catalyst 🚀

A full-stack career-learning and mentorship platform connecting **Students** with **Mentors** — structured courses, a coding practice arena, timed auto-graded tests, mentor-led groups, task management, points, leaderboards, achievements and an admin console.

| Stack | |
|---|---|
| Frontend | Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS |
| Auth | bcrypt password hashing · JWT session cookie + DB-backed sessions |
| Validation | Zod (single source of truth, server-side) |
| Data | Prisma ORM — SQLite for dev, PostgreSQL-ready for production |
| Charts | Recharts · Icons: lucide-react |
| Tests | Jest unit suites (validation, scoring, points, rate limiting, code runner, auth) |

## Quick start

```bash
npm install
npm run db:push      # create prisma/dev.db from the schema
npm run db:seed      # realistic demo data (users, courses, problems, group, tasks, tests)
npm run dev          # http://localhost:3000
```

Demo accounts (created by the seed, all use password `Password123!`):

| Role | Email |
|---|---|
| Admin | `admin@careercatalyst.dev` |
| Mentor | `mentor@careercatalyst.dev` |
| Student | `student@careercatalyst.dev` (Alex Chen) |
| Students | `priya@`, `daniel@`, `aisha@`, `tom@` `@careercatalyst.dev` |

The demo group invite code is `cc-frontend-2026` — sign in as any other student and join from **My Group**.

> The first admin account is **not** registerable from the UI. It is created by the seed in dev, and in production via a guarded provisioning script — see [docs/admin-bootstrap.md](docs/admin-bootstrap.md).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Jest unit suites |
| `npm run db:migrate` / `db:deploy` | Dev migration / production migration |
| `npm run db:seed` / `db:studio` | Seed demo data / inspect the DB |

## Feature map

**Students** — personalized dashboard (points, streak, profile completion, pending tasks, upcoming tests), course catalog with modules/lessons/quizzes and server-tracked completion, coding practice (5 seeded problems × 4 languages, run + submit with public/hidden test cases), timed tests with autosave and per-question navigation, task submissions with mentor review loop, group join via invite code, leaderboards (global + per-group, weekly rolling), achievements with points bonuses, notifications, profile with visibility controls.

**Mentors** — distinct dashboard with cohort statistics, group creation and invite-code rotation, test builder (MCQ / multi-select / true-false / short answer / coding, negative marking, availability windows, passing score), auto-grading plus manual grade panel, task builder with due dates/priority/points and review workflow (feedback, points, request-resubmission), per-student analytics with charts (score trend, points earned, task completion), announcements that notify the whole group, group leaderboards.

**Admin** — platform analytics dashboard, user management (search, filter, role changes, suspend/reactivate — suspension revokes sessions instantly), groups overview, full audit log with filtering and pagination. Admin accounts can never be created through public registration and admins cannot modify their own account.

**Security** — every mutation is a server actionguarded by role checks; Zod validates all input; points/scores are computed only on the backend from stored events; login has per-account+IP exponential lockout; rate limits on registration, code runs and announcements; DB-backed sessions with revocation; audit log of security-sensitive actions. See [docs/security.md](docs/security.md).

## Documentation

| Doc | Contents |
|---|---|
| [docs/database.md](docs/database.md) | All models, relations, indexes and business rules |
| [docs/api.md](docs/api.md) | Server actions + API routes, response conventions |
| [docs/authentication.md](docs/authentication.md) | Sessions, hashing, reset flow, lockout |
| [docs/security.md](docs/security.md) | Threat model, authorization matrix, audit logging |
| [docs/deployment.md](docs/deployment.md) | Env vars, staging/production, code-execution sandbox, backups |
| [docs/testing.md](docs/testing.md) | Test strategy and how to run suites |
| [docs/admin-bootstrap.md](docs/admin-bootstrap.md) | Creating the first admin securely |
| [docs/design-system.md](docs/design-system.md) | Colors, components, animations (the Figma ground truth) |

## Enrollment code of demo flow

1. **Student journey** — Get Started → pick Student → register → dashboard → join group (`cc-frontend-2026`) → complete a lesson (+10 pts) → solve a problem (+20) → take a test → earn points/achievements → submit a task → receive mentor feedback.
2. **Mentor journey** — Get Started → pick Mentor → register → create a group → share invite code → build a test → assign a task → monitor dashboards → review submissions → award points.

## Project structure

```
prisma/            schema.prisma (30+ models), seed.mjs, dev.db
src/app/
  (auth)/          signin, signup (student/mentor forms), forgot/reset password
  actions/         server actions: auth, groups, learning, tasks, tests, admin, engagement
  api/             coding run/submit, test autosave/submit, notifications, health
  admin/           dashboard, users, groups, audit-logs
  mentor/          dashboard, groups, students, tests, tasks, performance, announcements
  student/         dashboard, learn, practice, tests, tasks, group, leaderboard, profile…
  components/      ui kit, dashboard shell, landing sections
src/lib/           auth, guards, points, scoring, achievements, validation, rate-limit…
```

— Built with ❤️ for learners and mentors.
