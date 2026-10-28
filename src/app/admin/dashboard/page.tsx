import {
  Users, GraduationCap, Briefcase, Shield, Group as GroupIcon, ClipboardCheck, ClipboardList,
  Activity, ScrollText, UserPlus, CheckCircle2,
} from "lucide-react";
import { requireAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody, Badge, EmptyState } from "@/components/ui";
import { StatCard } from "@/components/ui";
import { formatDate, formatRelative } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    students, mentors, admins, suspended, activeUsers, groups,
    testsCreated, testsSubmitted, tasksCreated, tasksCompleted, pendingTasks,
    avgScore, signupsThisWeek, recentUsers, recentLogs,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "MENTOR" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { status: "SUSPENDED" } }),
    prisma.user.count({ where: { lastLoginAt: { gte: since } } }),
    prisma.group.count(),
    prisma.test.count(),
    prisma.testAttempt.count({ where: { status: "SUBMITTED" } }),
    prisma.task.count(),
    prisma.taskSubmission.count({ where: { status: "COMPLETED" } }),
    prisma.taskAssignment.count({ where: { status: { in: ["NOT_STARTED", "IN_PROGRESS"] } } }),
    prisma.testAttempt.aggregate({ where: { status: "SUBMITTED", percentage: { not: null } }, _avg: { percentage: true } }),
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { id: true, fullName: true, email: true, role: true, status: true, createdAt: true } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { actor: { select: { fullName: true } } } }),
  ]);

  const avg = avgScore._avg.percentage ? Math.round(avgScore._avg.percentage) : null;

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Platform analytics"
        description="Health, growth and activity across the entire platform."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total students" value={students} icon={<GraduationCap className="h-5 w-5" />} tone="primary" hint={`${signupsThisWeek} joined this week`} />
        <StatCard label="Total mentors" value={mentors} icon={<Briefcase className="h-5 w-5" />} tone="secondary" hint={`Groups active: ${groups}`} />
        <StatCard label="Active users (7d)" value={activeUsers} icon={<Activity className="h-5 w-5" />} tone="success" hint={`${suspended} suspended accounts`} />
        <StatCard label="Average test score" value={avg !== null ? `${avg}%` : "—"} icon={<CheckCircle2 className="h-5 w-5" />} tone="info" hint={`${testsSubmitted} submissions of ${testsCreated} tests`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tests assigned" value={testsCreated} icon={<ClipboardCheck className="h-5 w-5" />} tone="primary" />
        <StatCard label="Tasks assigned" value={tasksCreated} icon={<ClipboardList className="h-5 w-5" />} tone="warning" hint={`${pendingTasks} still open`} />
        <StatCard label="Tasks completed" value={tasksCompleted} icon={<Users className="h-5 w-5" />} tone="success" />
        <StatCard label="Admin accounts" value={admins} icon={<Shield className="h-5 w-5" />} tone="danger" hint="Never publicly registerable" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Newest users"
            icon={<UserPlus className="h-4 w-4" />}
            subtitle="Most recent signups across all roles"
          />
          <CardBody>
            {recentUsers.length === 0 ? (
              <EmptyState title="No users yet" icon={<Users className="h-6 w-6" />} />
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentUsers.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{u.fullName}</p>
                      <p className="truncate text-xs text-slate-400">{u.email}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone={u.role === "STUDENT" ? "primary" : u.role === "MENTOR" ? "secondary" : "danger"}>{u.role}</Badge>
                      {u.status === "SUSPENDED" ? <Badge tone="danger">Suspended</Badge> : null}
                      <span className="text-xs text-slate-400">{formatDate(u.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Recent security log"
            icon={<ScrollText className="h-4 w-4" />}
            subtitle="Latest audit events (full list under Audit Logs)"
          />
          <CardBody>
            {recentLogs.length === 0 ? (
              <EmptyState title="No audit events yet" icon={<ScrollText className="h-6 w-6" />} />
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentLogs.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{l.action}</p>
                      <p className="truncate text-xs text-slate-400">{l.actor?.fullName ?? "System"}{l.resource ? ` · ${l.resource}` : ""}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">{formatRelative(l.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Groups overview"
          icon={<GroupIcon className="h-4 w-4" />}
          subtitle={`Companies, cohorts and batches across all mentors — ${groups} total`}
        />
        <CardBody>
          <p className="text-sm text-slate-600">
            Manage accounts and groups from the <Badge tone="neutral">Users</Badge> and <Badge tone="neutral">Groups</Badge>
            {" "}sections. Every administrative action is recorded in the audit log with an actor, timestamp and resource.
          </p>
        </CardBody>
      </Card>
    </>
  );
}
