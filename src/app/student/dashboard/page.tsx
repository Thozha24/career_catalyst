import Link from "next/link";
import {
  Zap, Target, Flame, TrendingUp, BookOpen, ClipboardList, ListChecks, Trophy,
  ArrowRight, Calendar, Code2, Award,
} from "lucide-react";
import { requireStudent } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { refreshPointsWindows } from "@/lib/points";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody, Badge, Progress, StatCard, EmptyState, ButtonLink } from "@/components/ui";
import { formatDate, formatRelative, initials } from "@/lib/format";

export const dynamic = "force-dynamic";

function profileCompletion(p: {
  college: string | null; course: string | null; skills: string; interests: string; bio: string | null;
} & { user: { avatarUrl: string | null } }): number {
  const checks = [!!p.college, !!p.course, !!p.skills, !!p.interests, !!p.bio, !!p.user.avatarUrl];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export default async function StudentDashboard() {
  const user = await requireStudent();
  await refreshPointsWindows(user.id);

  const [profile, lessonDone, lessonTotal, recentAttempts, pendingTasks, upcomingTests, achievements, recentPoints, latestNotifications] =
    await Promise.all([
      prisma.studentProfile.findUnique({
        where: { userId: user.id },
        include: { mentor: { select: { fullName: true, mentorProfile: { select: { title: true } } } } },
      }),
      prisma.lessonProgress.count({ where: { userId: user.id } }),
      prisma.lesson.count(),
      prisma.testAttempt.findMany({
        where: { studentId: user.id, status: "SUBMITTED" },
        orderBy: { submittedAt: "desc" },
        take: 5,
        select: { percentage: true, passed: true, submittedAt: true, test: { select: { title: true } } },
      }),
      prisma.taskAssignment.findMany({
        where: { studentId: user.id, status: { in: ["NOT_STARTED", "IN_PROGRESS", "RESUBMIT"] } },
        orderBy: { updatedAt: "desc" },
        take: 4,
        select: {
          status: true,
          task: { select: { id: true, title: true, dueDate: true, pointsAward: true, priority: true } },
        },
      }),
      prisma.testAttempt.findMany({
        where: { studentId: user.id, status: "IN_PROGRESS" },
        take: 2,
        select: { id: true, startedAt: true, test: { select: { id: true, title: true, durationMin: true } } },
      }),
      prisma.studentAchievement.findMany({
        where: { studentId: user.id },
        orderBy: { earnedAt: "desc" },
        take: 6,
        include: { achievement: true },
      }),
      prisma.pointsTransaction.findMany({
        where: { studentId: user.id },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const group = await prisma.groupMember.findFirst({
    where: { studentId: user.id, isActive: true },
    include: { group: { select: { id: true, name: true, mentor: { select: { fullName: true } } } } },
    orderBy: { joinedAt: "desc" },
  });

  const avgScore =
    recentAttempts.length > 0
      ? Math.round(recentAttempts.reduce((s, a) => s + (a.percentage ?? 0), 0) / recentAttempts.length)
      : 0;
  const completion = profile ? profileCompletion({ ...profile, user: { avatarUrl: user.avatarUrl } }) : 0;

  return (
    <>
      <PageHeader
        eyebrow="Student Dashboard"
        title={`Welcome back, ${user.fullName.split(" ")[0]}! 👋`}
        description={group ? `You're part of ${group.group.name} — keep the momentum going.` : "Join a mentor group to unlock tests, tasks and mentorship."}
        action={
          <ButtonLink href="/student/learn">
            <BookOpen className="h-4 w-4" /> Start Learning
          </ButtonLink>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Points" value={(profile?.totalPoints ?? 0).toLocaleString()} icon={<Zap className="h-5 w-5" />} hint={`${profile?.weeklyPoints ?? 0} this week`} tone="primary" />
        <StatCard label="Tests Completed" value={profile?.testsCompleted ?? 0} icon={<Target className="h-5 w-5" />} hint={avgScore > 0 ? `Avg score ${avgScore}%` : "Take your first test"} tone="info" />
        <StatCard label="Learning Streak" value={`${profile?.currentStreak ?? 0}d`} icon={<Flame className="h-5 w-5" />} hint={`Best: ${profile?.longestStreak ?? 0} days`} tone="warning" />
        <StatCard label="Lessons Done" value={`${lessonDone}/${lessonTotal}`} icon={<TrendingUp className="h-5 w-5" />} hint={`${profile?.codingSolved ?? 0} problems solved`} tone="success" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Profile completion */}
          <Card className="animate-fade-in-up">
            <CardHeader
              title="Profile completion"
              subtitle={`${completion}% complete — a complete profile attracts mentors`}
              icon={<Award className="h-4 w-4" />}
              action={<ButtonLink href="/student/profile" variant="outline" size="sm">Edit profile</ButtonLink>}
            />
            <CardBody>
              <Progress value={completion} tone={completion >= 80 ? "success" : completion >= 50 ? "primary" : "warning"} />
              {completion < 100 ? (
                <p className="mt-2 text-xs text-slate-500">
                  {completion < 50 ? "Add your college, course and skills to get started." : "Almost there — add a bio or profile photo to reach 100%."}
                </p>
              ) : (
                <p className="mt-2 text-xs text-success-700">Looking sharp! Your profile is complete.</p>
              )}
            </CardBody>
          </Card>

          {/* Pending tasks */}
          <Card className="animate-fade-in-up animate-delay-100">
            <CardHeader
              title="Pending tasks"
              subtitle="Work assigned by your mentor"
              icon={<ListChecks className="h-4 w-4" />}
              action={<Link href="/student/tasks" className="text-sm font-semibold text-primary-600 hover:text-primary-700">View all →</Link>}
            />
            <CardBody className="space-y-3">
              {pendingTasks.length === 0 ? (
                <EmptyState icon={<ListChecks className="h-6 w-6" />} title="No pending tasks" description="You're all caught up. New tasks from your mentor will appear here." />
              ) : (
                pendingTasks.map(({ task, status }) => (
                  <Link key={task.id} href={`/student/tasks/${task.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3 transition-all hover:border-primary-200 hover:bg-primary-50/50">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{task.title}</p>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="h-3 w-3" /> Due {formatDate(task.dueDate)} · {task.pointsAward} pts
                      </p>
                    </div>
                    <Badge tone={status === "RESUBMIT" ? "warning" : status === "IN_PROGRESS" ? "info" : "neutral"}>
                      {status === "RESUBMIT" ? "Resubmit" : status === "IN_PROGRESS" ? "In progress" : "Not started"}
                    </Badge>
                  </Link>
                ))
              )}
            </CardBody>
          </Card>

          {/* Recent activity */}
          <Card className="animate-fade-in-up animate-delay-200">
            <CardHeader title="Recent activity" subtitle="Your latest points and results" icon={<Zap className="h-4 w-4" />} />
            <CardBody className="space-y-2.5">
              {recentPoints.length === 0 && recentAttempts.length === 0 ? (
                <EmptyState icon={<Code2 className="h-6 w-6" />} title="No activity yet" description="Complete a lesson or solve a problem to see activity here." action={<ButtonLink href="/student/learn" size="sm">Start learning</ButtonLink>} />
              ) : (
                <>
                  {recentAttempts.slice(0, 3).map((a, i) => (
                    <div key={`t-${i}`} className="flex items-center gap-3 text-sm">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-info-50 text-info-600"><ClipboardList className="h-4 w-4" /></span>
                      <p className="flex-1 truncate text-slate-600">Scored <strong className="text-ink">{a.percentage}%</strong> on {a.test.title}</p>
                      <span className="text-xs text-slate-400">{formatRelative(a.submittedAt)}</span>
                    </div>
                  ))}
                  {recentPoints.slice(0, 4).map((p) => (
                    <div key={p.id} className="flex items-center gap-3 text-sm">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning-50 text-warning-600"><Zap className="h-4 w-4" /></span>
                      <p className="flex-1 truncate text-slate-600">
                        +{p.points} points <span className="text-slate-400">· {p.reason.replaceAll("_", " ").toLowerCase()}</span>
                      </p>
                      <span className="text-xs text-slate-400">{formatRelative(p.createdAt)}</span>
                    </div>
                  ))}
                </>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Mentor & group */}
          <Card className="animate-fade-in-up animate-delay-100">
            <CardHeader title="Mentorship" icon={<Award className="h-4 w-4" />} />
            <CardBody className="space-y-4">
              {profile?.mentor ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-secondary-500 to-primary-600 text-sm font-bold text-white">
                    {initials(profile.mentor.fullName)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{profile.mentor.fullName}</p>
                    <p className="text-xs text-slate-500">{profile.mentor.mentorProfile?.title ?? "Mentor"}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No mentor yet — join a group to get matched.</p>
              )}
              {group ? (
                <Link href="/student/group" className="block rounded-xl bg-primary-50 px-4 py-3 transition-colors hover:bg-primary-100">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Your group</p>
                  <p className="mt-0.5 text-sm font-semibold text-ink">{group.group.name}</p>
                </Link>
              ) : (
                <ButtonLink href="/student/group" variant="success" className="w-full">Join a Group <ArrowRight className="h-4 w-4" /></ButtonLink>
              )}
              <ButtonLink href="/student/mentor" variant="outline" className="w-full">View Mentor</ButtonLink>
            </CardBody>
          </Card>

          {/* Upcoming / in-progress tests */}
          <Card className="animate-fade-in-up animate-delay-200">
            <CardHeader title="Tests" subtitle="In progress & recent results" icon={<ClipboardList className="h-4 w-4" />} action={<Link href="/student/tests" className="text-sm font-semibold text-primary-600 hover:text-primary-700">All →</Link>} />
            <CardBody className="space-y-3">
              {upcomingTests.length === 0 && recentAttempts.length === 0 ? (
                <p className="text-sm text-slate-500">No tests yet. Your mentor will assign them here.</p>
              ) : (
                <>
                  {upcomingTests.map((a) => (
                    <Link key={a.id} href={`/student/tests/${a.test.id}`} className="block rounded-xl bg-warning-50 px-4 py-3 ring-1 ring-inset ring-warning-100 transition-colors hover:bg-warning-100">
                      <p className="text-sm font-semibold text-ink">{a.test.title}</p>
                      <p className="mt-0.5 text-xs text-warning-700">In progress · {a.test.durationMin} min — finish before time runs out!</p>
                    </Link>
                  ))}
                  {recentAttempts.slice(0, 2).map((a, i) => (
                    <div key={`r-${i}`} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{a.test.title}</p>
                        <p className="text-xs text-slate-400">{formatRelative(a.submittedAt)}</p>
                      </div>
                      <Badge tone={a.passed ? "success" : "danger"}>{a.percentage}%</Badge>
                    </div>
                  ))}
                </>
              )}
            </CardBody>
          </Card>

          {/* Achievements */}
          <Card className="animate-fade-in-up animate-delay-300">
            <CardHeader title="Achievements" icon={<Trophy className="h-4 w-4" />} action={<Link href="/student/achievements" className="text-sm font-semibold text-primary-600 hover:text-primary-700">All →</Link>} />
            <CardBody>
              {achievements.length === 0 ? (
                <p className="text-sm text-slate-500">Complete lessons and solve problems to unlock badges.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {achievements.map(({ achievement }) => (
                    <span
                      key={achievement.id}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-soft"
                      style={{ backgroundColor: achievement.color }}
                      title={achievement.description}
                    >
                      <Trophy className="h-3 w-3" /> {achievement.name}
                    </span>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Notifications preview */}
          <Card className="animate-fade-in-up animate-delay-500">
            <CardHeader title="Notifications" action={<Link href="/student/notifications" className="text-sm font-semibold text-primary-600 hover:text-primary-700">All →</Link>} />
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
        </div>
      </div>
    </>
  );
}
