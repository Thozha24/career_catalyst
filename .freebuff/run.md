# Career Catalyst — how to run

Full-stack Next.js 15 app (App Router, React 19, TypeScript, Tailwind, Prisma/SQLite). This workspace IS the app root; dev server uses the project's default port **3000**.

## 1. Reproduce artifacts a fresh checkout needs

1. **Env file `.env`** (copy from the main checkout if this worktree lacks it — never commit values; format only):
   ```
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="<openssl rand -hex 32, 32+ chars>"
   APP_URL="http://localhost:3000"
   NODE_ENV="development"
   ```
2. **Install dependencies**: `npm ci` (Node ≥18.18; postinstall runs `prisma generate`).
3. **Database**: `npm run db:push` (creates `prisma/dev.db` from `prisma/schema.prisma`), then `npm run db:seed` for demo data (admin/mentor/students @careercatalyst.dev, password `Password123!`, group invite `cc-frontend-2026`). If `prisma/dev.db` already exists from the checkout, skip both.
4. Optional build check: `npm run typecheck && npm test && npm run build`.

## 2. Run the server

```bash
npm run dev          # next dev -p 3000
```

- Dev: http://localhost:3000 — if 3000 is taken, pick a free port and adjust `APP_URL` in `.env` accordingly. Note the run doc for each thread's server command (`npm run dev`) vs production (`npm run build && npm start`).
- Health probe: `GET /api/health` → `{"status":"ok","db":true}`.
- Demo logins: admin@ / mentor@ / student@ (and priya@, daniel@, aisha@, tom@) `@careercatalyst.dev`, all `Password123!`.
- Production-style detach (Windows PowerShell) used for previews: `(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -RedirectStandardOutput '<log>' -RedirectStandardError '<log>.err' -WindowStyle Hidden -PassThru).Id` — stdout and stderr MUST be different files.
