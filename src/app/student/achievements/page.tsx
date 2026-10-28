import { Trophy, Lock, Flame, Zap } from "lucide-react";
import { requireStudent } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { refreshPointsWindows } from "@/lib/points";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, Badge, StatCard, Progress } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function StudentAchievementsPage() {
  const user = await requireStudent();
  await refreshPointsWindows(user.id);

  const [profile, earned, catalog] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId: user.id } }),
    prisma.studentAchievement.findMany({
      where: { studentId: user.id },
      orderBy: { earnedAt: "desc" },
      include: { achievement: true },
    }),
    prisma.achievement.findMany({ orderBy: { pointsBonus: "desc" } }),
  ]);

  const earnedIds = new Set(earned.map((e) => e.achievementId));
  const locked = catalog.filter((a) => !earnedIds.has(a.id));
  const total = catalog.length;
  const progressPct = total > 0 ? Math.round((earned.length / total) * 100) : 0;

  return (
    <>
      <PageHeader
        eyebrow="Progress"
        title="Achievements"
        description="Badges unlock automatically as you learn, practice, and complete tests and tasks."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Badges earned" value={`${earned.length}/${total}`} icon={<Trophy className="h-5 w-5" />} tone="warning" />
        <StatCard label="Total points" value={(profile?.totalPoints ?? 0).toLocaleString()} icon={<Zap className="h-5 w-5" />} tone="primary" hint={`${profile?.weeklyPoints ?? 0} this week`} />
        <StatCard label="Learning streak" value={`${profile?.currentStreak ?? 0} days`} icon={<Flame className="h-5 w-5" />} tone="danger" hint={`Best: ${profile?.longestStreak ?? 0}`} />
      </div>

      <Card className="mt-6">
        <CardBody>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-ink">Badge collection</span>
            <span className="text-slate-400">{progressPct}%</span>
          </div>
          <Progress value={earned.length} max={Math.max(1, total)} tone={progressPct >= 80 ? "success" : "warning"} />
        </CardBody>
      </Card>

      {/* Earned */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Earned ({earned.length})</h2>
        {earned.length === 0 ? (
          <Card><CardBody className="text-sm text-slate-500">No badges yet — complete your first lesson to unlock one! 🚀</CardBody></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {earned.map(({ achievement, earnedAt }) => (
              <Card key={achievement.id} className="card-hover relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: achievement.color }} />
                <CardBody className="flex items-start gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-soft"
                    style={{ backgroundColor: achievement.color }}
                  >
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-ink">{achievement.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{achievement.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge tone="success">Earned {formatDate(earnedAt)}</Badge>
                      {achievement.pointsBonus > 0 ? <Badge tone="warning">+{achievement.pointsBonus} bonus</Badge> : null}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Locked */}
      {locked.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Still locked ({locked.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {locked.map((a) => (
              <Card key={a.id} className="opacity-75">
                <CardBody className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-600">{a.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{a.description}</p>
                    {a.pointsBonus > 0 ? <Badge tone="neutral" className="mt-2">+{a.pointsBonus} bonus</Badge> : null}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
