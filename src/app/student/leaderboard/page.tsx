import { Medal, Flame, Zap, Trophy } from "lucide-react";
import { requireStudent } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { refreshPointsWindows } from "@/lib/points";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody, Badge, Progress, StatCard } from "@/components/ui";
import { Tabs } from "@/components/ui-client";
import { initials } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function StudentLeaderboardPage() {
  const user = await requireStudent();
  await refreshPointsWindows(user.id);

  const members = await prisma.groupMember.findMany({
    where: { studentId: user.id, isActive: true },
    select: { groupId: true },
  });
  const groupIds = members.map((m) => m.groupId);

  const global = await prisma.studentProfile.findMany({
    orderBy: [{ totalPoints: "desc" }, { weeklyPoints: "desc" }],
    take: 25,
    include: { user: { select: { id: true, fullName: true, studentProfile: { select: { currentStreak: true } } } } },
  });

  const groupScoped = groupIds.length
    ? await prisma.groupMember.findMany({
        where: { groupId: { in: groupIds }, isActive: true },
        include: { group: { select: { name: true } }, student: { select: { id: true, fullName: true, studentProfile: { select: { weeklyPoints: true, totalPoints: true } } } } },
      })
    : [];

  const globalRows = global.map((p, i) => ({
    rank: i + 1,
    id: p.userId,
    name: p.user.fullName,
    total: p.totalPoints,
    weekly: p.weeklyPoints,
    streak: p.currentStreak,
  }));

  const groupAgg = new Map<string, { name: string; weekly: number; total: number }>();
  for (const gm of groupAggSource(groupScoped)) {
    const cur = groupAgg.get(gm.id) ?? { name: gm.name, weekly: 0, total: 0 };
    cur.weekly += gm.weekly;
    cur.total += gm.total;
    groupAgg.set(gm.id, cur);
  }
  const groupRows = [...groupAgg.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.weekly - a.weekly || b.total - a.total)
    .slice(0, 25)
    .map((r, i) => ({ rank: i + 1, ...r }));

  const myGlobal = globalRows.find((r) => r.id === user.id);
  const myGroupRank = groupRows.findIndex((r) => r.id === user.id) + 1;
  const podium = globalRows.slice(0, 3);
  const topTotal = Math.max(1, ...globalRows.map((r) => r.total));

  return (
    <>
      <PageHeader
        eyebrow="Progress"
        title="Leaderboard"
        description="Top learners across the platform and in your groups. Weekly points reset every 7 days."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Global rank" value={myGlobal ? `#${myGlobal.rank}` : "—"} icon={<Medal className="h-5 w-5" />} tone="primary" />
        <StatCard label="Group rank" value={myGroupRank > 0 ? `#${myGroupRank}` : "—"} icon={<Trophy className="h-5 w-5" />} tone="warning" />
        <StatCard label="Streak" value={`${globalRows.find((r) => r.id === user.id)?.streak ?? 0} days`} icon={<Flame className="h-5 w-5" />} tone="danger" />
      </div>

      {/* Podium */}
      {podium.length > 0 ? (
        <Card className="mt-6">
          <CardBody>
            <div className="grid grid-cols-3 items-end gap-3">
              {[podium[1], podium[0], podium[2]].map((p, idx) =>
                p ? (
                  <div key={p.id} className={p.id === user.id ? "rounded-2xl bg-primary-50 p-3 ring-1 ring-inset ring-primary-200" : "rounded-2xl p-3"}>
                    <div className="flex flex-col items-center text-center">
                      <div
                        className={`flex items-center justify-center rounded-full text-sm font-bold text-white ${
                          idx === 1 ? "h-16 w-16 bg-gradient-to-br from-warning-400 to-warning-600 text-lg shadow-lift" : "h-12 w-12 bg-gradient-to-br from-primary-400 to-secondary-600"
                        }`}
                      >
                        {initials(p.name)}
                      </div>
                      <p className="mt-2 max-w-full truncate text-sm font-semibold text-ink" title={p.name}>{p.name}</p>
                      <p className="text-xs text-slate-500">{p.total.toLocaleString()} pts</p>
                      <span className={`mt-1 text-2xl ${idx === 1 ? "" : "opacity-80"}`}>{idx === 1 ? "🥇" : idx === 0 ? "🥈" : "🥉"}</span>
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </CardBody>
        </Card>
      ) : null}

      <div className="mt-6">
        <Tabs
          tabs={[
            {
              id: "global",
              label: "🌍 Global",
              content: <LeaderboardTable rows={globalRows} meId={user.id} topValue={topTotal} metric="total" />,
            },
            {
              id: "group",
              label: "👥 My groups",
              content:
                groupRows.length > 0 ? (
                  <LeaderboardTable rows={groupRows} meId={user.id} topValue={Math.max(1, ...groupRows.map((r) => r.weekly))} metric="weekly" />
                ) : (
                  <Card><CardBody className="text-sm text-slate-500">Join a mentor group to compete with your cohort.</CardBody></Card>
                ),
            },
          ]}
        />
      </div>
    </>
  );
}

function groupAggSource(rows: { student: { id: string; fullName: string; studentProfile: { weeklyPoints: number; totalPoints: number } | null } }[]) {
  return rows.map((r) => ({ id: r.student.id, name: r.student.fullName, weekly: r.student.studentProfile?.weeklyPoints ?? 0, total: r.student.studentProfile?.totalPoints ?? 0 }));
}

function LeaderboardTable({
  rows,
  meId,
  topValue,
  metric,
}: {
  rows: { rank: number; id: string; name: string; total: number; weekly?: number; streak?: number }[];
  meId: string;
  topValue: number;
  metric: "total" | "weekly";
}) {
  return (
    <Card>
      <CardHeader
        title={metric === "total" ? "All-time points" : "This week's points"}
        subtitle="Top 25 learners"
        icon={<Zap className="h-4 w-4" />}
      />
      <CardBody className="space-y-1">
        {rows.length === 0 ? <p className="text-sm text-slate-500">No data yet.</p> : null}
        {rows.map((r) => (
          <div key={r.id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${r.id === meId ? "bg-primary-50 ring-1 ring-inset ring-primary-200" : ""}`}>
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${r.rank === 1 ? "bg-warning-100 text-warning-700" : r.rank <= 3 ? "bg-secondary-100 text-secondary-700" : "bg-slate-100 text-slate-500"}`}>
              #{r.rank}
            </span>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-secondary-600 text-[11px] font-bold text-white">
              {initials(r.name)}
            </div>
            <p className={`min-w-0 flex-1 truncate text-sm ${r.id === meId ? "font-bold text-primary-800" : "font-medium text-slate-700"}`}>
              {r.name}{r.id === meId ? " (you)" : ""}
            </p>
            {r.streak != null && r.streak > 0 ? <Badge tone="warning"><Flame className="h-3 w-3" /> {r.streak}d</Badge> : null}
            <div className="hidden w-40 sm:block">
              <Progress value={metric === "total" ? r.total : (r.weekly ?? 0)} max={topValue} tone={r.rank === 1 ? "warning" : "primary"} />
            </div>
            <span className="w-16 shrink-0 text-right text-sm font-bold tabular-nums text-ink">
              {(metric === "total" ? r.total : (r.weekly ?? 0)).toLocaleString()}
            </span>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
