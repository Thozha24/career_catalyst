# Deployment

## Environments

| Environment | Database | Notes |
|---|---|---|
| development | SQLite (`file:./dev.db`) via Prisma | `npm run dev`; seedable demo data |
| staging | PostgreSQL (managed, separate instance) | `prisma migrate deploy`; demo email disabled; rate limits on |
| production | PostgreSQL (managed, PITR) | HTTPS only, secure cookies, secrets in the platform's secret store |

Build order for any deployment: `npm ci && npx prisma generate && npm run typecheck && npm test && npm run build`.

## Environment variables (all required settings in `.env.example`)

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | Prisma connection (SQLite dev / PostgreSQL prod, `connection_limit=10`) |
| `JWT_SECRET` | ✅ | ≥32 chars (`openssl rand -hex 32`). Rotating it kills all sessions |
| `APP_URL` | ✅ | Canonical origin, used in links (reset/verify emails) |
| `NODE_ENV` | ✅ | `production` enables secure cookies |
| `SMTP_URL` / `EMAIL_FROM` | ⬜ | Password-reset & verification delivery; without SMTP, dev logs the token |
| `S3_*` | ⬜ | Object storage for uploads (private bucket + signed URLs) |
| `CODE_RUNNER_URL` / `CODE_RUNNER_TOKEN` | ⬜ | **Production: required for real code execution** (see below) |

Never commit real secrets; inject via the platform secret manager at deploy time. The health probe at `/api/health` is used by uptime checks/runbooks.

## Sizing expectations

Single Node process comfortably serves hundreds of concurrent learners: page data is paginated aggregates; points windows and leaderboards are O(indexed-column sorts); rate limits are in-memory (add Redis-backed store for multi-replica horizontal scaling — the `rateLimit()` call signature is store-agnostic).

## Sandboxed code execution (production)

The `code-runner` layer **never executes student code in the Next.js process**. Set `CODE_RUNNER_URL` to an isolated executor (Judge0 hosted, or self-hosted Firecracker/gVisor pool) that:

1. runs each submission in a **one-shot** container — no network, read-only rootfs, `tmpfs /tmp`, non-root user;
2. caps vCPU (≈1 core), memory (256 MB) and wall time (10 s);
3. rejects dangerous syscalls/imports via seccomp/LSM profiles;
4. speaks the same JSON contract as `lib/code-runner.ts` (`POST /execute` → `{verdict, passedCount, totalCount, runtimeMs, outputs[]}`), with `CODE_RUNNER_TOKEN` bearer auth.

Until it's configured, submissions are graded by the deterministic dev evaluator — safe by construction, but flag real execution in prod as a launch gate.

## Backups & reliability

- **Automated backups**: nightly `pg_dump` to encrypted object storage + managed PITR (target RPO ≤ 15 min).
- **Restore drill**: restore dump into a scratch instance, `prisma migrate deploy` (no-op), run `/api/health`, spot-check a cohort's joins/submissions/points ledger before re-pointing traffic. Track restore time; document it here per environment.
- **Migrations**: always expand → deploy → contract; deploy via `npm run db:deploy` in CI before the app rollout.
- **Error monitoring**: ship server logs (pino) to your APM; unhandled server-action errors surface only as friendly UI states.
- **Graceful degradation**: DB outage renders friendly error/empty states (no data loss: autosave queues only server-side), rate limiter fails closed on writes.
