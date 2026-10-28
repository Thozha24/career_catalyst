import { Users, Megaphone, CalendarDays, Trophy, UserCheck, KeyRound } from "lucide-react";
import { requireStudent } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody, Badge, EmptyState, Progress } from "@/components/ui";
import { formatDate, formatRelative, initials } from "@/lib/format";
import { JoinGroupForm } from "./join-form";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ joined?: string }> };

export default async function StudentGroupPage({ searchParams }: Props) {
  const { joined } = await searchParams;
  const user = await requireStudent();

  const memberships = await prisma.groupMember.findMany({
    where: { studentId: user.id, isActive: true },
    orderBy: { joinedAt: "asc" },
    include: {
      group: {
        include: {
          mentor: { select: { id: true, fullName: true, mentorProfile: { select: { title: true } } } },
          _count: { select: { members: true, tasks: true, tests: true } },
          announcements: { orderBy: { createdAt: "desc" }, take: 3 },
        },
      },
    },
  });

  // Group leaderboards (weekly points)
  const leaderboards = await Promise.all(
    memberships.map(async ({ group }) => {
      const members = await prisma.groupMember.findMany({
        where: { groupId: group.id, isActive: true },
        select: {
          student: { select: { id: true, fullName: true, studentProfile: { select: { weeklyPoints: true, totalPoints: true } } } },
        },
      });
      const rows = members
        .map((m) => ({
          id: m.student.id,
          name: m.student.fullName,
          weekly: m.student.studentProfile?.weeklyPoints ?? 0,
          total: m.student.studentProfile?.totalPoints ?? 0,
        }))
        .sort((a, b) => b.weekly - a.weekly || b.total - a.total)
        .slice(0, 5);
      return { groupId: group.id, groupName: group.name, rows };
    })
  );

  const hasGroups = memberships.length > 0;
  const topWeekly = Math.max(1, ...leaderboards.flatMap((l) => l.rows.map((r) => r.weekly)));

  return (
    <>
      <PageHeader
        eyebrow="Mentorship"
        title="My Group"
        description="Your mentor-led groups, announcements and group leaderboard."
      />

      {joined === "1" ? (
        <Card className="mb-6 border-success-100 bg-success-50/60"><CardBody className="text-sm font-medium text-success-800">Welcome to the group! 🎉 Your mentor has been notified.</CardBody></Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {hasGroups ? (
            memberships.map(({ group }) => (
              <Card key={group.id}>
                <CardHeader
                  title={group.name}
                  subtitle={group.description ?? undefined}
                  icon={<Users className="h-4 w-4" />}
                  action={<Badge tone="primary">{group._count.members} members</Badge>}
                />
                <CardBody className="space-y-5">
                  <div className="flex items-center gap-3 rounded-xl bg-primary-50/60 px-4 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-secondary-500 to-primary-600 text-sm font-bold text-white">
                      {initials(group.mentor.fullName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{group.mentor.fullName}</p>
                      <p className="text-xs text-slate-500">{group.mentor.mentorProfile?.title ?? "Mentor"}</p>
                    </div>
                    <Badge tone="neutral"><UserCheck className="h-3 w-3" /> Your mentor</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-slate-50 px-3 py-3">
                      <p className="text-lg font-bold text-ink">{group._count.tasks}</p>
                      <p className="text-xs text-slate-500">Tasks</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-3">
                      <p className="text-lg font-bold text-ink">{group._count.tests}</p>
                      <p className="text-xs text-slate-500">Tests</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-3">
                      <p className="text-lg font-bold text-ink">{formatDate(group.createdAt).split(",")[0]}</p>
                      <p className="text-xs text-slate-500">Created</p>
                    </div>
                  </div>

                  {/* Announcements */}
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-slate-500">
                      <Megaphone className="h-3.5 w-3.5" /> Announcements
                    </p>
                    {group.announcements.length === 0 ? (
                      <p className="text-sm text-slate-400">No announcements yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {group.announcements.map((a) => (
                          <li key={a.id} className="rounded-xl border border-slate-100 px-4 py-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-ink">{a.title}</p>
                              <span className="text-xs text-slate-400">{formatRelative(a.createdAt)}</span>
                            </div>
                            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{a.body}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))
          ) : (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="You're not in a group yet"
              description="Ask your mentor for an invite code, then join below. Groups unlock tests, tasks, feedback and leaderboards."
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {!hasGroups ? (
            <Card>
              <CardHeader title="Join with an invite code" icon={<KeyRound className="h-4 w-4" />} />
              <CardBody>
                <JoinGroupForm />
              </CardBody>
            </Card>
          ) : null}

          {leaderboards.map((lb) => (
            <Card key={lb.groupId}>
              <CardHeader title={`${lb.groupName} — top 5`} subtitle="Weekly points" icon={<Trophy className="h-4 w-4" />} />
              <CardBody className="space-y-3">
                {lb.rows.map((r, i) => {
                  const isMe = r.id === user.id;
                  return (
                    <div key={r.id} className="space-y-1">
                      <div className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-sm ${isMe ? "font-bold text-primary-700" : "text-slate-600"}`}>
                        <span className="flex items-center gap-2">
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${i === 0 ? "bg-warning-100 text-warning-700" : "bg-slate-100 text-slate-500"}`}>
                            {i + 1}
                          </span>
                          {r.name}{isMe ? " (you)" : ""}
                        </span>
                        <span className="tabular-nums">{r.weekly} pts</span>
                      </div>
                      <Progress value={r.weekly} max={topWeekly} tone={i === 0 ? "warning" : "primary"} />
                    </div>
                  );
                })}
                {lb.rows.length === 0 ? <p className="text-sm text-slate-400">No members yet.</p> : null}
              </CardBody>
            </Card>
          ))}

          <Card>
            <CardBody className="text-xs text-slate-400">
              <p className="flex items-center gap-1.5 font-semibold text-slate-500"><CalendarDays className="h-3.5 w-3.5" /> Tip</p>
              <p className="mt-1">Weekly points reset every 7 days. Complete lessons, tests and tasks to climb the leaderboard.</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
