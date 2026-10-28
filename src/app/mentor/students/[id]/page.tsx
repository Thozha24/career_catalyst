import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Zap, Target, ListChecks, Flame, Trophy, ClipboardList,
  MessageSquareQuote, BookOpen, Code2,
} from "lucide-react";
import { requireMentor, mentorCanAccessStudent } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { refreshPointsWindows } from "@/lib/points";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody, Badge, StatCard, Progress, EmptyState, ButtonLink } from "@/components/ui";
import { formatDate, formatRelative, initials, splitList } from "@/lib/format";
import { ScoreTrendChart, ActivityChart } from "./charts";
import { FeedbackForm } from "./feedback-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function MentorStudentDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requireMentor();

  if (!(await mentorCanAccessStudent(user.id, id))) notFound();

  await refreshPointsWindows(id);

  const student = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, fullName: true, email: true, lastLoginAt: true, createdAt: true,
      studentProfile: { include: { mentor: { select: { fullName: true } } } },
    },
  });
  if (!student || !student.studentProfile) notFound();
  const profile = student.studentProfile;

  const [attempts, taskAssignments, achievements, feedback, lessonProgress, codingSubs, memberships] = await Promise.all([
    prisma.testAttempt.findMany({
      where: { studentId: id, status: "SUBMITTED" },
      orderBy: { submittedAt: "asc" },
      take: 12,
      select: { id: true, percentage: true, passed: true, submittedAt: true, test: { select: { title: true } } },
    }),
    prisma.taskAssignment.findMany({
      where: { studentId: id },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: { task: { select: { id: true, title: true, dueDate: true, pointsAward: true } } },
    }),
    prisma.studentAchievement.findMany({
      where: { studentId: id },
      orderBy: { earnedAt: "desc" },
      include: { achievement: { select: { name: true, color: true, icon: true } } },
    }),
    prisma.feedback.findMany({
      where: { recipientId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { author: { select: { fullName: true } } },
    }),
    prisma.lessonProgress.findMany({
      where: { userId: id },
      orderBy: { completedAt: "asc" },
      select: { completedAt: true },
    }),
    prisma.codingSubmission.findMany({
      where: { userId: id, verdict: "ACCEPTED" },
      select: { createdAt: true, problemId: true },
      distinct: ["problemId"],
    }),
    prisma.groupMember.findMany({
      where: { studentId: id, isActive: true, group: { mentorId: user.id } },
      include: { group: { select: { name: true } } },
    }),
  ]);

  const avgScore = attempts.length ? Math.round(attempts.reduce((s, a) => s + (a.percentage ?? 0), 0) / attempts.length) : 0;
  const pendingTasks = taskAssignments.filter((a) => ["NOT_STARTED", "IN_PROGRESS", "RESUBMIT"].includes(a.status));
  const completedTasks = taskAssignments.filter((a) => a.status === "COMPLETED");

  return (
    <>
      <Link href="/mentor/students" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-600">
        <ArrowLeft className="h-4 w-4" /> All students
      </Link>

      <PageHeader
        eyebrow={memberships.map((m) => m.group.name).join(" · ") || "Student"}
        title={student.fullName}
        description={`${student.email} · last active ${formatRelative(student.lastLoginAt)} · joined ${formatDate(student.createdAt)}`}
        action={
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-600 text-lg font-bold text-white shadow-lift">
            {initials(student.fullName)}
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total points" value={profile.totalPoints.toLocaleString()} icon={<Zap className="h-5 w-5" />} hint={`${profile.weeklyPoints} this week`} tone="warning" />
        <StatCard label="Avg test score" value={attempts.length ? `${avgScore}%` : "—"} icon={<Target className="h-5 w-5" />} hint={`${profile.testsCompleted} tests taken`} tone="info" />
        <StatCard label="Tasks completed" value={profile.tasksCompleted} icon={<ListChecks className="h-5 w-5" />} hint={`${pendingTasks.length} pending now`} tone="success" />
        <StatCard label="Streak" value={`${profile.currentStreak}d`} icon={<Flame className="h-5 w-5" />} hint={`Best: ${profile.longestStreak}d`} tone="danger" />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Score trend" subtitle="Last 12 test attempts" icon={<Target className="h-4 w-4" />} />
          <CardBody>
            {attempts.length === 0 ? (
              <p className="text-sm text-slate-400">No test attempts yet.</p>
            ) : (
              <ScoreTrendChart
                data={attempts.map((a) => ({
                  label: a.test.title.length > 14 ? a.test.title.slice(0, 13) + "…" : a.test.title,
                  value: a.percentage ?? 0,
                  passed: !!a.passed,
                }))}
              />
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Activity" subtitle="Lessons completed & problems solved (last 8 weeks)" icon={<BookOpen className="h-4 w-4" />} />
          <CardBody>
            <ActivityChart
              lessons={lessonProgress.map((l) => l.completedAt.toISOString())}
              problems={codingSubs.map((c) => c.createdAt.toISOString())}
            />
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left */}
        <div className="space-y-6 lg:col-span-2">
          {/* Skills & learning */}
          <Card>
            <CardHeader title="Profile & skills" icon={<Trophy className="h-4 w-4" />} />
            <CardBody className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="label-base">Skills</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {splitList(profile.skills).length ? splitList(profile.skills).map((s) => <Badge key={s} tone="primary">{s}</Badge>) : <p className="text-sm text-slate-400">Not added</p>}
                  </div>
                </div>
                <div>
                  <p className="label-base">Interests</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {splitList(profile.interests).length ? splitList(profile.interests).map((s) => <Badge key={s} tone="secondary">{s}</Badge>) : <p className="text-sm text-slate-400">Not added</p>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-slate-50 px-3 py-3">
                  <p className="text-lg font-bold text-ink">{profile.codingSolved}</p>
                  <p className="text-xs text-slate-500">Problems solved</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-3">
                  <p className="text-lg font-bold text-ink">{lessonProgress.length}</p>
                  <p className="text-xs text-slate-500">Lessons done</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-3">
                  <p className="text-lg font-bold text-ink">{profile.testsPassed}</p>
                  <p className="text-xs text-slate-500">Tests passed</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Tasks */}
          <Card>
            <CardHeader
              title="Tasks"
              subtitle={`${completedTasks.length} completed · ${pendingTasks.length} pending`}
              icon={<ListChecks className="h-4 w-4" />}
              action={<Link href="/mentor/tasks" className="text-sm font-semibold text-primary-600 hover:text-primary-700">Manage →</Link>}
            />
            <CardBody className="space-y-2">
              {taskAssignments.length === 0 ? (
                <p className="text-sm text-slate-400">No tasks assigned yet.</p>
              ) : (
                taskAssignments.map(({ task, status }) => (
                  <Link key={task.id} href={`/mentor/tasks/${task.id}`} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2.5 transition-colors hover:border-primary-200">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{task.title}</p>
                      <p className="text-xs text-slate-400">Due {formatDate(task.dueDate)} · {task.pointsAward} pts</p>
                    </div>
                    <Badge tone={status === "COMPLETED" ? "success" : status === "SUBMITTED" ? "warning" : status === "RESUBMIT" ? "danger" : "neutral"}>
                      {status.replaceAll("_", " ").toLowerCase()}
                    </Badge>
                  </Link>
                ))
              )}
            </CardBody>
          </Card>

          {/* Feedback history */}
          <Card>
            <CardHeader title="Recent feedback" icon={<MessageSquareQuote className="h-4 w-4" />} />
            <CardBody className="space-y-2">
              {feedback.length === 0 ? (
                <p className="text-sm text-slate-400">No feedback recorded yet — use the form to add the first note.</p>
              ) : (
                feedback.map((f) => (
                  <div key={f.id} className="rounded-xl border border-slate-100 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-ink">{f.author.fullName}</p>
                      <span className="text-xs text-slate-400">{formatRelative(f.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{f.comment}</p>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Give feedback" subtitle="Notifies the student instantly" icon={<MessageSquareQuote className="h-4 w-4" />} />
            <CardBody>
              <FeedbackForm studentId={student.id} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Achievements" icon={<Trophy className="h-4 w-4" />} />
            <CardBody className="flex flex-wrap gap-2">
              {achievements.length === 0 ? (
                <p className="text-sm text-slate-400">No badges yet.</p>
              ) : (
                achievements.map(({ achievement }) => (
                  <span
                    key={achievement.name}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: achievement.color }}
                    title={achievement.name}
                  >
                    <Trophy className="h-3 w-3" /> {achievement.name}
                  </span>
                ))
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Recent test results" icon={<ClipboardList className="h-4 w-4" />} />
            <CardBody className="space-y-2">
              {attempts.length === 0 ? (
                <p className="text-sm text-slate-400">No attempts yet.</p>
              ) : (
                [...attempts].reverse().slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-700">{a.test.title}</p>
                      <p className="text-xs text-slate-400">{formatRelative(a.submittedAt)}</p>
                    </div>
                    <Badge tone={a.passed ? "success" : "danger"}>{a.percentage}%</Badge>
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-xs text-slate-400">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-600"><Code2 className="h-4 w-4" /> Groups</p>
              <ul className="mt-1.5 space-y-1">
                {memberships.length ? memberships.map((m) => <li key={m.id}>👥 {m.group.name}</li>) : <li>Not in your groups.</li>}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
