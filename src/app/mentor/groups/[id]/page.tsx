import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Users, KeyRound, RefreshCw, Megaphone, ClipboardList, ListChecks, Trophy, ArrowLeft, CalendarDays,
} from "lucide-react";
import { requireMentor, isGroupMentor } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody, Badge, EmptyState } from "@/components/ui";
import { formatDate, formatRelative, initials } from "@/lib/format";
import { CopyButton, Tabs } from "@/components/ui-client";
import { RotateInviteButton } from "./rotate-invite";
import { GroupLeaderboard } from "./group-leaderboard";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function MentorGroupDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requireMentor();

  if (!(await isGroupMentor(user.id, id))) notFound();

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      _count: { select: { members: { where: { isActive: true } }, tasks: true, tests: true } },
      announcements: { orderBy: { createdAt: "desc" }, take: 5, include: { author: { select: { fullName: true } } } },
      tests: { orderBy: { createdAt: "desc" }, take: 5, select: { id: true, title: true, createdAt: true, _count: { select: { attempts: true, questions: true } } } },
      tasks: { orderBy: { createdAt: "desc" }, take: 5, select: { id: true, title: true, dueDate: true, createdAt: true, _count: { select: { submissions: { where: { status: "SUBMITTED" } } } } } },
    },
  });
  if (!group) notFound();

  const members = await prisma.groupMember.findMany({
    where: { groupId: id, isActive: true },
    orderBy: { joinedAt: "asc" },
    include: {      student: { select: { id: true, fullName: true, email: true, studentProfile: { select: { totalPoints: true, currentStreak: true, weeklyPoints: true } } } } },
  });

  const leaderboardRows = members
    .map((m) => ({
      id: m.student.id,
      name: m.student.fullName,
      total: m.student.studentProfile?.totalPoints ?? 0,
      weekly: m.student.studentProfile?.weeklyPoints ?? 0,
      streak: m.student.studentProfile?.currentStreak ?? 0,
    }))
    .sort((a, b) => b.weekly - a.weekly || b.total - a.total);

  return (
    <>
      <Link href="/mentor/groups" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-600">
        <ArrowLeft className="h-4 w-4" /> All groups
      </Link>

      <PageHeader
        eyebrow="Group"
        title={group.name}
        description={group.description ?? undefined}
        action={<Badge tone="primary"><Users className="h-3 w-3" /> {group._count.members} members</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Students" subtitle="Everyone currently in this group" icon={<Users className="h-4 w-4" />} />
            <CardBody>
              {members.length === 0 ? (
                <EmptyState
                  icon={<Users className="h-6 w-6" />}
                  title="No students yet"
                  description="Share the invite code below so students can join your group."
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {members.map((m) => (
                    <li key={m.id}>
                      <Link href={`/mentor/students/${m.studentId}`} className="flex items-center gap-3 py-3 transition-colors hover:bg-slate-50">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-secondary-600 text-xs font-bold text-white">
                          {initials(m.student.fullName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">{m.student.fullName}</p>
                          <p className="truncate text-xs text-slate-400">{m.student.email}</p>
                        </div>
                        <Badge tone="warning" className="hidden sm:inline-flex">{m.student.studentProfile?.totalPoints ?? 0} pts</Badge>
                        <Badge tone="neutral" className="hidden md:inline-flex">Joined {formatDate(m.joinedAt)}</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Tabs
            tabs={[
              {
                id: "tests",
                label: <><ClipboardList className="mr-1 inline h-4 w-4" /> Tests ({group.tests.length})</>,
                content: (
                  <Card>
                    <CardBody className="space-y-2">
                      {group.tests.length === 0 ? (
                        <p className="text-sm text-slate-500">No tests assigned to this group yet. <Link className="font-semibold text-primary-600" href="/mentor/tests/new">Create one →</Link></p>
                      ) : (
                        group.tests.map((t) => (
                          <Link key={t.id} href={`/mentor/tests/${t.id}`} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 transition-colors hover:border-primary-200">
                            <div>
                              <p className="text-sm font-semibold text-ink">{t.title}</p>
                              <p className="text-xs text-slate-400">{t._count.questions} questions · {t._count.attempts} attempts</p>
                            </div>
                            <span className="text-xs text-slate-400">{formatRelative(t.createdAt)}</span>
                          </Link>
                        ))
                      )}
                    </CardBody>
                  </Card>
                ),
              },
              {
                id: "tasks",
                label: <><ListChecks className="mr-1 inline h-4 w-4" /> Tasks ({group.tasks.length})</>,
                content: (
                  <Card>
                    <CardBody className="space-y-2">
                      {group.tasks.length === 0 ? (
                        <p className="text-sm text-slate-500">No tasks yet. <Link className="font-semibold text-primary-600" href="/mentor/tasks/new">Assign a task →</Link></p>
                      ) : (
                        group.tasks.map((t) => (
                          <Link key={t.id} href={`/mentor/tasks/${t.id}`} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 transition-colors hover:border-primary-200">
                            <div>
                              <p className="text-sm font-semibold text-ink">{t.title}</p>
                              <p className="text-xs text-slate-400">Due {formatDate(t.dueDate)} · {t._count.submissions} awaiting review</p>
                            </div>
                            <span className="text-xs text-slate-400">{formatRelative(t.createdAt)}</span>
                          </Link>
                        ))
                      )}
                    </CardBody>
                  </Card>
                ),
              },
              {
                id: "announcements",
                label: <><Megaphone className="mr-1 inline h-4 w-4" /> Announcements</>,
                content: (
                  <Card>
                    <CardBody className="space-y-3">
                      {group.announcements.length === 0 ? (
                        <p className="text-sm text-slate-500">No announcements yet. <Link className="font-semibold text-primary-600" href={`/mentor/announcements?groupId=${group.id}`}>Post one →</Link></p>
                      ) : (
                        group.announcements.map((a) => (
                          <div key={a.id} className="rounded-xl border border-slate-100 px-4 py-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-ink">{a.title}</p>
                              <span className="text-xs text-slate-400">{formatRelative(a.createdAt)}</span>
                            </div>
                            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{a.body}</p>
                          </div>
                        ))
                      )}
                    </CardBody>
                  </Card>
                ),
              },
              {
                id: "leaderboard",
                label: <><Trophy className="mr-1 inline h-4 w-4" /> Leaderboard</>,
                content: <GroupLeaderboard rows={leaderboardRows} meId={null} />,
              },
            ]}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Invite code" subtitle="Students join with this code" icon={<KeyRound className="h-4 w-4" />} />
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-4 py-3">
                <code className="font-mono text-sm font-bold text-ink">{group.inviteCode}</code>
                <CopyButton text={group.inviteCode} label="Copy" />
              </div>
              <RotateInviteButton groupId={group.id} />
              <p className="text-xs text-slate-400">Rotating invalidates the old code immediately.</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-sm text-slate-500">
              <p className="flex items-center gap-1.5 font-semibold text-ink"><CalendarDays className="h-4 w-4 text-primary-500" /> Group stats</p>
              <ul className="mt-2 space-y-1.5">
                <li className="flex justify-between"><span>Students</span> <span className="font-semibold text-ink">{group._count.members}</span></li>
                <li className="flex justify-between"><span>Tests assigned</span> <span className="font-semibold text-ink">{group._count.tests}</span></li>
                <li className="flex justify-between"><span>Tasks assigned</span> <span className="font-semibold text-ink">{group._count.tasks}</span></li>
                <li className="flex justify-between"><span>Created</span> <span className="font-semibold text-ink">{formatDate(group.createdAt)}</span></li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
