import Link from "next/link";
import {
  Users, ClipboardList, ListChecks, TrendingUp, Megaphone,
  ArrowRight, Zap, Star,
} from "lucide-react";
import { requireMentor } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody, Badge, StatCard, EmptyState, ButtonLink, Progress } from "@/components/ui";
import { formatRelative, formatDate, initials } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MentorDashboard() {
  const user = await requireMentor();

  const [groups, tests, tasks, recentSubmissions, recentAttempts, latestNotifications] = await Promise.all([
    prisma.group.findMany({
      where: { mentorId: user.id },
      include: {
        _count: { select: { members: { where: { isActive: true } } } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.test.findMany({ where: { createdBy: user.id }, select: { id: true, groupId: true } }),
    prisma.task.findMany({ where: { createdBy: user.id }, select: { id: true } }),
    prisma.taskSubmission.findMany({
      where: { task: { createdBy: user.id }, status: "SUBMITTED", reviewedAt: null },
      orderBy: { submittedAt: "desc" },
      take: 5,
      include: {
        student: { select: { fullName: true } },
        task: { select: { id: true, title: true } },
      },
    }),
    prisma.testAttempt.findMany({
      where: { test: { createdBy: user.id }, status: "SUBMITTED" },
      orderBy: { submittedAt: "desc" },
      take: 6,
      include: {
        student: { select: { fullName: true } },
        test: { select: { title: true } },
      },
    }),
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const groupIds = groups.map((g) => g.id);

  const [activeStudents, pendingReviews, completedSubs, totalMembers] = await Promise.all([
    prisma.groupMember.count({ where: { groupId: { in: groupIds }, isActive: true, student: { lastLoginAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) } } } }),
    prisma.taskSubmission.count({ where: { task: { createdBy: user.id }, status: "SUBMITTED" } }),
    prisma.taskSubmission.count({ where: { task: { createdBy: user.id }, status: "COMPLETED" } }),
    prisma.groupMember.count({ where: { groupId: { in: groupIds }, isActive: true } }),
  ]);

  const attemptsCompleted = recentAttempts.length;
  const avgScore = attemptsCompleted > 0 ? Math.round(recentAttempts.reduce((s, a) => s + (a.percentage ?? 0), 0) / attemptsCompleted) : 0;
  const pendingGrading = await prisma.testAttempt.count({
    where: {
      test: { createdBy: user.id },
      status: "SUBMITTED",
      answers: { some: { isCorrect: null, question: { type: { in: ["SHORT_ANSWER", "CODING"] } } } },
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="Mentor Dashboard"
        title={`Welcome, ${user.fullName.split(" ")[0]} 🧭`}
        description="Your students, groups and teaching pipeline at a glance."
        action={
          <ButtonLink href="/mentor/tests/new">
            <ClipboardList className="h-4 w-4" /> Assign Test
          </ButtonLink>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Students" value={totalMembers} icon={<Users className="h-5 w-5" />} hint={`${activeStudents} active this week`} tone="primary" />
        <StatCard label="Tests assigned" value={tests.length} icon={<ClipboardList className="h-5 w-5" />} hint={`${attemptsCompleted} recent attempts`} tone="info" />
        <StatCard label="Tasks pending" value={pendingReviews} icon={<ListChecks className="h-5 w-5" />} hint={`${completedSubs} completed`} tone="warning" />
        <StatCard label="Avg score (recent)" value={attemptsCompleted > 0 ? `${avgScore}%` : "—"} icon={<TrendingUp className="h-5 w-5" />} hint={`${pendingGrading} need manual grading`} tone="success" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Groups */}
          <Card className="animate-fade-in-up">
            <CardHeader
              title="My groups"
              subtitle="Manage members, invite codes and group activity"
              icon={<Users className="h-4 w-4" />}
              action={<Link href="/mentor/groups" className="text-sm font-semibold text-primary-600 hover:text-primary-700">All groups →</Link>}
            />
            <CardBody className="space-y-3">
              {groups.length === 0 ? (
                <EmptyState
                  icon={<Users className="h-6 w-6" />}
                  title="No groups yet"
                  description="Create your first group, then share the invite code with students."
                  action={<ButtonLink href="/mentor/groups">Create Group</ButtonLink>}
                />
              ) : (
                groups.map((g) => (
                  <Link key={g.id} href={`/mentor/groups/${g.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3 transition-all hover:border-primary-200 hover:bg-primary-50/50">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{g.name}</p>
                      <p className="text-xs text-slate-500">{g._count.members} students · created {formatDate(g.createdAt)}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
                  </Link>
                ))
              )}
            </CardBody>
          </Card>

          {/* Submissions awaiting review */}
          <Card className="animate-fade-in-up animate-delay-100">
            <CardHeader
              title="Submissions to review"
              subtitle="Tasks waiting on your feedback"
              icon={<ListChecks className="h-4 w-4" />}
              action={<Link href="/mentor/tasks" className="text-sm font-semibold text-primary-600 hover:text-primary-700">Review →</Link>}
            />
            <CardBody className="space-y-3">
              {recentSubmissions.length === 0 ? (
                <p className="text-sm text-slate-500">Nothing waiting — all caught up. 🎉</p>
              ) : (
                recentSubmissions.map((s) => (
                  <Link key={s.id} href={`/mentor/tasks/${s.taskId}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3 transition-all hover:border-primary-200 hover:bg-primary-50/50">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-secondary-600 text-[11px] font-bold text-white">
                        {initials(s.student.fullName)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{s.student.fullName} · {s.task.title}</p>
                        <p className="text-xs text-slate-400">Submitted {formatRelative(s.submittedAt)}</p>
                      </div>
                    </div>
                    <Badge tone="warning">Review</Badge>
                  </Link>
                ))
              )}
            </CardBody>
          </Card>

          {/* Recent test activity */}
          <Card className="animate-fade-in-up animate-delay-200">
            <CardHeader title="Recent test results" icon={<ClipboardList className="h-4 w-4" />} />
            <CardBody className="space-y-2.5">
              {recentAttempts.length === 0 ? (
                <p className="text-sm text-slate-500">No test attempts yet. Assign a test to your group.</p>
              ) : (
                recentAttempts.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 text-sm">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-info-50 text-info-600"><ClipboardList className="h-4 w-4" /></span>
                    <p className="flex-1 truncate text-slate-600">
                      <strong className="text-ink">{a.student.fullName}</strong> scored {a.percentage}% on {a.test.title}
                    </p>
                    <Badge tone={a.passed ? "success" : "danger"}>{a.passed ? "Pass" : "Fail"}</Badge>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card className="animate-fade-in-up animate-delay-100">
            <CardHeader title="Quick actions" icon={<Zap className="h-4 w-4" />} />
            <CardBody className="space-y-2">
              <ButtonLink href="/mentor/tests/new" variant="outline" className="w-full">📝 Create test</ButtonLink>
              <ButtonLink href="/mentor/tasks/new" variant="outline" className="w-full">📌 Assign task</ButtonLink>
              <ButtonLink href="/mentor/announcements" variant="outline" className="w-full">📢 Post announcement</ButtonLink>
              <ButtonLink href="/mentor/students" variant="outline" className="w-full">👥 Monitor students</ButtonLink>
            </CardBody>
          </Card>

          <Card className="animate-fade-in-up animate-delay-200">
            <CardHeader title="Notifications" icon={<Megaphone className="h-4 w-4" />} action={<Link href="/mentor/notifications" className="text-sm font-semibold text-primary-600 hover:text-primary-700">All →</Link>} />
            <CardBody className="space-y-2">
              {latestNotifications.length === 0 ? (
                <p className="text-sm text-slate-500">You're all caught up.</p>
              ) : (
                latestNotifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-2.5 text-sm">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? "bg-slate-200" : "bg-primary-500"}`} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-700">{n.title}</p>
                      <p className="text-xs text-slate-400">{formatRelative(n.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          <Card className="animate-fade-in-up animate-delay-300">
            <CardBody className="text-sm text-slate-500">
              <p className="flex items-center gap-1.5 font-semibold text-ink"><Star className="h-4 w-4 text-warning-500" /> Grading tip</p>
              <p className="mt-1">Objective questions are graded instantly. Short-answer and coding answers wait for your manual marks in <Link className="font-semibold text-primary-600" href="/mentor/tests">Tests → results</Link>.</p>
              <Progress value={Math.max(0, 100 - Math.min(100, pendingGrading * 20))} tone={pendingGrading === 0 ? "success" : "warning"} className="mt-3" />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
