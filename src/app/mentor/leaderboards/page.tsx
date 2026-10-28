import { Medal, Users } from "lucide-react";
import { requireMentor } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody, Badge, EmptyState, ButtonLink, Progress } from "@/components/ui";
import { initials } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MentorLeaderboardsPage() {
  const user = await requireMentor();

  const groups = await prisma.group.findMany({
    where: { mentorId: user.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, name: true,
      members: {
        where: { isActive: true },
        select: {
          student: { select: { id: true, fullName: true, studentProfile: { select: { totalPoints: true, weeklyPoints: true, currentStreak: true } } } },
        },
      },
    },
  });

  if (groups.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Insights" title="Leaderboards" description="Weekly and all-time rankings for each of your groups." />
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No groups yet"
          description="Create a group and invite students to see rankings."
          action={<ButtonLink href="/mentor/groups">Go to groups</ButtonLink>}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Insights"
        title="Leaderboards"
        description="Weekly points reset every 7 days — all-time totals always accumulate."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {groups.map((g) => {
          const rows = g.members
            .map((m) => ({
              id: m.student.id,
              name: m.student.fullName,
              total: m.student.studentProfile?.totalPoints ?? 0,
              weekly: m.student.studentProfile?.weeklyPoints ?? 0,
              streak: m.student.studentProfile?.currentStreak ?? 0,
            }))
            .sort((a, b) => b.weekly - a.weekly || b.total - a.total);
          const top = Math.max(1, ...rows.map((r) => r.weekly));
          return (
            <Card key={g.id}>
              <CardHeader title={g.name} subtitle={`${rows.length} students`} icon={<Medal className="h-4 w-4" />} />
              <CardBody className="space-y-1">
                {rows.length === 0 ? <p className="text-sm text-slate-400">No members yet.</p> : null}
                {rows.map((r, i) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${i === 0 ? "bg-warning-100 text-warning-700" : i < 3 ? "bg-secondary-100 text-secondary-700" : "bg-slate-100 text-slate-500"}`}>
                      #{i + 1}
                    </span>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-secondary-600 text-[11px] font-bold text-white">
                      {initials(r.name)}
                    </div>
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{r.name}</p>
                    {r.streak > 0 ? <Badge tone="warning">🔥 {r.streak}d</Badge> : null}
                    <div className="hidden w-28 sm:block"><Progress value={r.weekly} max={top} tone={i === 0 ? "warning" : "primary"} /></div>
                    <span className="w-14 shrink-0 text-right text-sm font-bold tabular-nums text-ink">{r.weekly}</span>
                    <span className="hidden w-20 shrink-0 text-right text-xs text-slate-400 md:block">{r.total} total</span>
                  </div>
                ))}
              </CardBody>
            </Card>
          );
        })}
      </div>
    </>
  );
}
