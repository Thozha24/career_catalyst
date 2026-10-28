import { KeyRound, ShieldCheck, Monitor } from "lucide-react";
import { requireStudent } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody, Badge } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { ChangePasswordForm } from "@/components/change-password-form";

export const dynamic = "force-dynamic";

export default async function StudentSettingsPage() {
  const user = await requireStudent();

  const sessions = await prisma.session.findMany({
    where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: "desc" },
    take: 5,
    select: { id: true, ip: true, userAgent: true, createdAt: true, lastSeenAt: true },
  });

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your password and review account security."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Change password" subtitle="Other sessions will be signed out" icon={<KeyRound className="h-4 w-4" />} />
            <CardBody>
              <ChangePasswordForm />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Account" icon={<ShieldCheck className="h-4 w-4" />} />
            <CardBody className="space-y-2 text-sm">
              <p className="flex justify-between gap-2"><span className="text-slate-500">Email</span> <span className="truncate font-medium text-ink">{user.email}</span></p>
              <p className="flex justify-between gap-2"><span className="text-slate-500">Role</span> <Badge tone="primary">Student</Badge></p>
              <p className="flex justify-between gap-2"><span className="text-slate-500">Status</span> <Badge tone={user.status === "ACTIVE" ? "success" : "warning"}>{user.status.toLowerCase()}</Badge></p>
              <p className="flex justify-between gap-2"><span className="text-slate-500">Email verified</span> <Badge tone={user.emailVerified ? "success" : "warning"}>{user.emailVerified ? "Yes" : "Pending"}</Badge></p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Active sessions" subtitle="Most recent sign-ins" icon={<Monitor className="h-4 w-4" />} />
            <CardBody className="space-y-3">
              {sessions.map((s) => (
                <div key={s.id} className="rounded-xl border border-slate-100 px-4 py-3">
                  <p className="truncate text-xs font-semibold text-ink" title={s.userAgent ?? undefined}>
                    {s.userAgent ? s.userAgent.split(")")[0] + ")" : "Unknown device"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {s.ip ?? "unknown ip"} · active {formatDateTime(s.lastSeenAt)}
                  </p>
                </div>
              ))}
              {sessions.length === 0 ? <p className="text-sm text-slate-400">No active sessions found.</p> : null}
              <p className="text-xs text-slate-400">Changing your password signs out every other device automatically.</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
