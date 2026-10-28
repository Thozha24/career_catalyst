# Database schema

`prisma/schema.prisma` defines **28 models** over a relational core. Dev runs SQLite (`prisma/dev.db`); production runs the **same schema on PostgreSQL** — every model uses only PostgreSQL-compatible column types. To switch, set `provider = "postgresql"` and point `DATABASE_URL` at a Postgres instance.

## Entity map (grouped)

**Identity & access**
- `User` — one account per person; `role` ∈ {STUDENT, MENTOR, ADMIN} (one primary role), `status` ∈ {ACTIVE, SUSPENDED, PENDING_VERIFICATION}, unique `email`, `passwordHash` (bcrypt, never plaintext), soft delete via `deletedAt`.
- `Session` — DB-backed session rows: sha-256 `tokenHash` (the raw side of the JWT-part token), `ip`, `userAgent`, `expiresAt`, `revokedAt` (revocation = logout + suspend).
- `PasswordResetToken`, `EmailVerificationToken` — stores only the **hash** of an opaque 32-byte token, with `expiresAt` and `usedAt`.
- `AuditLog` — actor, action, resource(+id), metadata JSON, ip/userAgent.

**Profiles**
- `StudentProfile` — 1:1 with User. Education, skills/interests/languages, projects & certifications (JSON), `profileVisibility` ∈ {PRIVATE, GROUP, PUBLIC}, **denormalized counters** (`totalPoints`, `weeklyPoints`, `monthlyPoints`, `currentStreak`, `testsCompleted`, `testsPassed`, `codingSolved`, `tasksCompleted`) maintained exclusively by validated backend events.
- `MentorProfile` — title, organization, yearsExperience, expertise, bio (1:1 with User).

**Mentorship**
- `Group` — owned by a mentor (`mentorId`, FK), unique rotating `inviteCode`.
- `GroupMember` — `@@unique([groupId, studentId])` ⇒ a student cannot join the same group twice; `isActive` for soft-exits.
- `GroupInvitation` — per-email invitation codes with status & expiry.

**Learning**
- `Course → Module → Lesson` (cascade deletes), lessons carry content, code example and a JSON quiz; `LessonProgress` with `@@unique([userId, lessonId])` — completion recorded once, server-side.

**Coding practice**
- `CodingProblem` — difficulty, I/O formats, constraints, per-language `starterCode`, JSON `testCases` (`hidden` cases are never sent to the client).
- `CodingSubmission` — language, code, verdict, `passedCount/totalCount`, runtime, points awarded (verdicts: PENDING/ACCEPTED/WRONG_ANSWER/ERROR/TIMEOUT).

**Assessments**
- `Test` — per-group, duration, availability window, `passingScore`, `negativeMarking`.
- `TestQuestion` — type ∈ {MCQ, MULTI_SELECT, TRUE_FALSE, SHORT_ANSWER, CODING}, `marks`/`negativeMarks`.
- `TestOption` — some options `isCorrect` (answers never rendered to test-takers).
- `TestAttempt` — `@@unique([testId, studentId, attemptNo])` ⇒ attempts always belong to the authenticated student; stores score, percentage, passed, time taken.
- `TestAnswer` — one per question per attempt (`@@unique([attemptId, questionId])`), autosaved by the exam runner, graded server-side.

**Tasks**
- `Task` — priority, due date, points, resources; belongs to a group.
- `TaskAssignment` — `@@unique([taskId, studentId])` with status enum (NOT_STARTED → … → COMPLETED / RESUBMIT).
- `TaskSubmission` — `@@unique([taskId, studentId])`: content, fileUrl, feedback, points awarded, review timestamps.

**Gamification & communication**
- `PointsTransaction` — immutable ledger: every point change is a row (reason, description, source ids). Frontends never write here.
- `Achievement` / `StudentAchievement` — `@@unique([studentId, achievementId])` so badges unlock once.
- `Notification` (typed, `isRead`, history), `Feedback` (mentor → student, optional rating), `Announcement` (per group, fan-out notifications).

## Cross-cutting conventions

- Every child table has an explicit `onDelete` policy (mostly `Cascade` for owned rows, `SetNull` for optional links like a student's mentor).
- FK lookup paths are indexed (`@@index` on mentorId, groupId, studentId, userId, createdAt…).
- Timestamps (`createdAt`/`updatedAt`) everywhere; composite queries (filters/sorting/pagination) only over indexed columns.
- Business-rule constraints live at the DB level via unique keys (no duplicate group joins, single submission per task, single attempt row per (test, student, attempt#)) and at the application level via guards in `src/lib/guards.ts`.

## Migrations in production

```bash
DATABASE_URL="postgresql://…" npx prisma migrate deploy   # apply committed migrations
npm run db:deploy                                          # same via script
```

Backups: nightly `pg_dump` to encrypted object storage + point-in-time recovery on the managed Postgres (see docs/deployment.md). Dev SQLite is disposable (`npm run db:push && npm run db:seed`).
