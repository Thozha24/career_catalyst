import { BarChart3, TrendingUp, TrendingDown, Award, AlertTriangle } from "lucide-react";
import { requireMentor } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody, Badge, EmptyState, ButtonLink, Progress } from "@/components/ui";
import { formatRelative, initials } from "@/lib/format";
import { GroupComparisonChart } from "./comparison-chart";

export const dynamic = "force-dynamic";

export default async function MentorPerformancePage() {
  const user = await requireMentor();

  const groups = await prisma.group.findMany({
    where: { mentorId: user.id },
    select: {
      id: true, name: true,
      members: {
        where: { isActive: true },
        select: {
          studentId: true,
          student: { select: { fullName: true, studentProfile: { select: { totalPoints: true, testsCompleted: true, tasksCompleted: true, codingSolved: true, currentStreak: true } } } },
        },
      },
    },
  });

  const attempts = await prisma.testAttempt.findMany({
    where: { status: "SUBMITTED", test: { createdBy: user.id } },
    orderBy: { submittedAt: "desc" },
    take: 300,
    select: { id: true, percentage: true, passed: true, studentId: true, submittedAt: true, test: { select: { title: true } } },
  });

  if (groups.length === 0 || attempts.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Insights" title="Performance" description="Cohort analytics across your tests and groups." />
        <EmptyState
          icon={<BarChart3 className="h-6 w-6" />}
          title="Not enough data yet"
          description="Performance analytics appear once students start submitting tests."
          action={<ButtonLink href="/mentor/tests/new">Assign a test</ButtonLink>}
        />
      </>
    );
  }

  // Distribution buckets
  const buckets = [
    { label: "0–49%", min: 0, max: 49 },
    { label: "50–69%", min: 50, max: 69 },
    { label: "70–84%", min: 70, max: 84 },
    { label: "85–100%", min: 85, max: 100 },
  ].map((b) => ({
    label: b.label,
    count: attempts.filter((a) => (a.percentage ?? 0) >= b.min && (a.percentage ?? 0) <= b.max).length,
  }));

  // Per-student averages
  const perStudent = new Map<string, { name: string; scores: number[]; points: number }>();
  const studentName = new Map<string, string>();
  for (const g of groups) {
    for (const m of g.members) {
      studentName.set(m.studentId, m.student.fullName);
      perStudent.set(m.studentId, {
        name: m.student.fullName,
        scores: [],
        points: m.student.studentProfile?.totalPoints ?? 0,
      });
    }
  }
  for (const a of attempts) {
    const entry = perStudent.get(a.studentId);
    if (entry) entry.scores.push(a.percentage ?? 0);
  }
  const students = [...perStudent.entries()]
    .map(([id, v]) => ({
      id,
      name: v.name,
      avg: v.scores.length ? Math.round(v.scores.reduce((s, x) => s + x, 0) / v.scores.length) : null,
      attempts: v.scores.length,
      points: v.points,
    }))
    .filter((s) => s.attempts > 0);

  const topPerformers = [...students].filter((s) => s.avg !== null).sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0)).slice(0, 5);
  const atRisk = [...students]
    .filter((s) => s.avg !== null && (s.avg ?? 0) < 50)
    .sort((a, b) => (a.avg ?? 0) - (b.avg ?? 0))
    .slice(0, 5);

  // Group comparison
  const groupData = groups.map((g) => {
    const ids = new Set(g.members.map((m) => m.studentId));
    const groupAttempts = attempts.filter((a) => ids.has(a.studentId));
    return {
      name: g.name.length > 18 ? g.name.slice(0, 17) + "…" : g.name,
      avgScore: groupAttempts.length ? Math.round(groupAttempts.reduce((s, a) => s + (a.percentage ?? 0), 0) / groupAttempts.length) : 0,
      attempts: groupAttempts.length,
    };
  });

  const overallAvg = Math.round(attempts.reduce((s, a) => s + (a.percentage ?? 0), 0) / attempts.length);
  const passRate = Math.round((attempts.filter((a) => a.passed).length / attempts.length) * 100);

  return (
    <>
      <PageHeader
        eyebrow="Insights"
        title="Performance"
        description={`Aggregate of the last ${attempts.length} test attempts across your groups.`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Overall average</p>
          <p className="mt-1 text-3xl font-bold text-ink">{overallAvg}%</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Pass rate</p>
          <p className="mt-1 text-3xl font-bold text-ink">{passRate}%</p>
          <p className="mt-1 text-xs text-slate-400">{attempts.filter((a) => a.passed).length} of {attempts.length} attempts</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Attempts analyzed</p>
          <p className="mt-1 text-3xl font-bold text-ink">{attempts.length}</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Score distribution" subtitle="All recent attempts" icon={<BarChart3 className="h-4 w-4" />} />
          <CardBody className="space-y-3">
            {buckets.map((b) => (
              <div key={b.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-600">{b.label}</span>
                  <span className="tabular-nums text-slate-400">{b.count}</span>
                </div>
                <Progress value={b.count} max={attempts.length} tone={b.label.startsWith("85") ? "success" : b.label.startsWith("0") ? "danger" : "primary"} />
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Group comparison" subtitle="Average score per group" icon={<TrendingUp className="h-4 w-4" />} />
          <CardBody>
            <GroupComparisonChart data={groupData} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Top performers" subtitle="Highest average scores" icon={<Award className="h-4 w-4" />} />
          <CardBody className="space-y-2">
            {topPerformers.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 rounded-xl px-3 py-2">
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${i === 0 ? "bg-warning-100 text-warning-700" : "bg-secondary-100 text-secondary-700"}`}>
                  #{i + 1}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-secondary-600 text-[11px] font-bold text-white">
                  {initials(s.name)}
                </div>
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{s.name}</p>
                <Badge tone="success">{s.avg}% avg</Badge>
                <span className="hidden text-xs text-slate-400 sm:block">{s.attempts} tests</span>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Needs attention" subtitle="Averages below the 50% line" icon={<AlertTriangle className="h-4 w-4" />} />
          <CardBody className="space-y-2">
            {atRisk.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-slate-500"><TrendingDown className="h-4 w-4" /> Nobody below 50% — great cohort!</p>
            ) : (
              atRisk.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-xl px-3 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-600">
                    {initials(s.name)}
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{s.name}</p>
                  <Badge tone="danger">{s.avg}% avg</Badge>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <p className="mt-6 text-xs text-slate-400">Updated {formatRelative(new Date())} · scores come from server-side grading only.</p>
    </>
  );
}
