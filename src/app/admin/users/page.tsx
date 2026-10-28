import { Search, Users, ShieldBan, ShieldCheck, ShieldQuestion } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody, Badge, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { UserAdminControls } from "./user-admin-controls";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; role?: string }> };

export default async function AdminUsersPage({ searchParams }: Props) {
  const admin = await requireAdmin();
  const { q = "", role = "" } = await searchParams;

  const where = {
    OR: [
      { fullName: { contains: q, mode: "insensitive" as const } },
      { email: { contains: q, mode: "insensitive" as const } },
    ],
    ...(role === "STUDENT" || role === "MENTOR" || role === "ADMIN" ? { role: role as "STUDENT" | "MENTOR" | "ADMIN" } : {}),
  };

  const [users, stats] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, fullName: true, email: true, role: true, status: true, lastLoginAt: true, createdAt: true, _count: { select: { memberships: { where: { isActive: true } } } } },
    }),
    prisma.user.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const stat = (s: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION") => stats.find((x) => x.status === s)?._count._all ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Users"
        description="Search accounts, adjust roles, and suspend or reactivate offenders. Every change is audited."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft">
          <div className="flex items-center gap-2 text-success-700"><ShieldCheck className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-wide">Active</span></div>
          <p className="mt-1 text-2xl font-bold text-ink">{stat("ACTIVE")}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft">
          <div className="flex items-center gap-2 text-danger-700"><ShieldBan className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-wide">Suspended</span></div>
          <p className="mt-1 text-2xl font-bold text-ink">{stat("SUSPENDED")}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft">
          <div className="flex items-center gap-2 text-warning-700"><ShieldQuestion className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-wide">Pending verification</span></div>
          <p className="mt-1 text-2xl font-bold text-ink">{stat("PENDING_VERIFICATION")}</p>
        </div>
      </div>

      <Card>
        <CardHeader title={`${users.length} account${users.length === 1 ? "" : "s"}`} icon={<Users className="h-4 w-4" />} subtitle="You are signed in as an admin — you cannot modify your own account here" />
        <CardBody>
          <form className="mb-4 flex flex-wrap items-center gap-2" action="/admin/users" method="GET">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input name="q" defaultValue={q} placeholder="Search name or email…" className="input-base pl-9" aria-label="Search users" />
            </div>
            <select name="role" defaultValue={role} className="input-base h-10 w-36" aria-label="Filter by role">
              <option value="">All roles</option>
              <option value="STUDENT">Students</option>
              <option value="MENTOR">Mentors</option>
              <option value="ADMIN">Admins</option>
            </select>
            <button className="h-10 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-500" type="submit">Filter</button>
          </form>

          {users.length === 0 ? (
            <EmptyState icon={<Users className="h-6 w-6" />} title="No matching users" description="Try a different search term or role filter." />
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.id} data-testid={`admin-user-${u.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-surface p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{u.fullName}</p>
                      <Badge tone={u.role === "STUDENT" ? "primary" : u.role === "MENTOR" ? "secondary" : "danger"}>{u.role}</Badge>
                      {u.status === "ACTIVE" ? <Badge tone="success">Active</Badge> : u.status === "SUSPENDED" ? <Badge tone="danger">Suspended</Badge> : <Badge tone="warning">Unverified</Badge>}
                      {u._count.memberships > 0 ? <Badge tone="info">{u._count.memberships} group{u._count.memberships === 1 ? "" : "s"}</Badge> : null}
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-400">
                      {u.email} · joined {formatDate(u.createdAt)} · last login {u.lastLoginAt ? formatDate(u.lastLoginAt) : "never"}
                    </p>
                  </div>
                  {u.id === admin.id ? (
                    <Badge tone="neutral">You — cannot self-modify</Badge>
                  ) : u.role === "ADMIN" ? (
                    <Badge tone="danger">Protected admin</Badge>
                  ) : (
                    <UserAdminControls userId={u.id} status={u.status} role={u.role} />
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="mt-4 text-xs text-slate-400">
            Showing the newest 100 accounts. Suspending a user immediately revokes all of their active sessions.
            Need a deeper view? Open <Link href="/admin/audit-logs" className="font-semibold text-primary-600 hover:underline">Audit Logs</Link>.
          </p>
        </CardBody>
      </Card>
    </>
  );
}
