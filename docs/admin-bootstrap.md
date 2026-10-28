# Creating the first admin account

Admin accounts are **never** registerable through the public signup flow (registration accepts only STUDENT/MENTOR). Bootstrap the first admin like this:

## Production (recommended: guarded provisioning)

1. Ship the app with a strong `JWT_SECRET` and migrate the database (`npm run db:deploy`).
2. From a trusted shell (CI runner with the production secret injected, or a password-protected bastion):

   ```bash
   node - <<'EOF'
   import { PrismaClient } from "@prisma/client";
   import bcrypt from "bcryptjs";

   const prisma = new PrismaClient();
   const email = process.argv[2] ?? "root@your-domain.tld";

   const password = crypto.randomBytes(18).toString("base64url"); // one-time
   const admin = await prisma.user.upsert({
     where: { email },
     create: {
       email,
       fullName: "Platform Admin",
       role: "ADMIN",
       status: "ACTIVE",
       emailVerified: true,
       passwordHash: await bcrypt.hash(password, 12),
     },
     update: { role: "ADMIN", status: "ACTIVE" }, // never touches passwordHash
   });
   console.log(`Admin ready: ${admin.email}\nOne-time password: ${password}\nDelete this output.`);
   await prisma.$disconnect();
   EOF
   ```

3. **Deliver the password out-of-band** (secrets manager/1Password), never in code, tickets or logs; force a change on first sign-in by handling it like any other user password change.
4. Rotate again later via the same upsert (it deliberately never resets a password on rematch) or from the admin UI.

## Development (seed)

`npm run db:seed` creates `admin@careercatalyst.dev` / `Password123!` **for local dev only** — the seeded DB must never be reused for staging/production. The seed also stamps `docs` hints and a demo invite code.

## Why the ceremony?

- Public signup accepts STUDENT/MENTOR only; the application layer forbids role self-upgrades.
- Admin power is broad (roles, suspensions, audit visibility), so creation stays a data-provisioning step, auditable in `AuditLog` next to subsequent `ROLE_CHANGED` events.
- Admin self-modification is blocked in `adminUpdateUserAction` — the lockout path above cannot brick the platform.
