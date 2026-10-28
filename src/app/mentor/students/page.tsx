import Link from "next/link";
import { Users, Search, Flame, Zap, ArrowRight } from "lucide-react";
import { requireMentor } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, Badge, EmptyState, ButtonLink } from "@/components/ui";
import { initials, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; groupId?: string }> };

export default async function MentorStudentsPage({ searchParams }: Props) {
  const { q, groupId } = await searchParams;
  const user = await requireMentor();

  const groups = await prisma.group.findMany({
    where: { mentorId: user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  const memberships = await prisma.groupMember.findMany({
    where: {
      isActive: true,
      group: { mentorId: user.id, ...(groupId ? { id: groupId } : {}) },
      student: q ? { OR: [{ fullName: { contains: q } }, { email: { contains: q } }] } : undefined,
    },
    include: {
      group: { select: { name: true } },
      student: {
        select: {
          id: true, fullName: true, email: true, lastLoginAt: true,
          studentProfile: { select: { totalPoints: true, weeklyPoints: true, currentStreak: true, testsCompleted: true, tasksCompleted: true, codingSolved: true, college: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  // Dedupe students across multiple groups
  const seen = new Map<string, (typeof memberships)[number]["student"] & { groups: string[] }>();
  for (const m of memberships) {
    const existing = seen.get(m.student.id);
    if (existing) {
      if (!existing.groups.includes(m.group.name)) existing.groups.push(m.group.name);
    } else {
      seen.set(m.student.id, { ...m.student, groups: [m.group.name] });
    }
  }
  const students = [...seen.values()];

  return (
    <>
      <PageHeader
        eyebrow="Mentorship"
        title="Students"
        description="Everyone in your groups — click a student to open their full monitoring dashboard."
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form action="/mentor/students" method="get" className="flex flex-1 items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Search by name or email…"
                className="input-base pl-9"
                aria-label="Search students"
              />
            </div>
            {groupId ? <input type="hidden" name="groupId" value={groupId} /> : null}
            <button type="submit" className="btn-base hidden sm:inline-flex" hidden>Search</button>
          </form>
          <div className="flex flex-wrap items-center gap-1.5">
            <Link
              href="/mentor/students"
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors ${!groupId ? "bg-primary-600 text-white ring-primary-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"}`}
            >
              All
            </Link>
            {groups.map((g) => (
              <Link
                key={g.id}
                href={`/mentor/students?groupId=${g.id}`}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors ${groupId === g.id ? "bg-primary-600 text-white ring-primary-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"}`}
              >
                {g.name}
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>

      {students.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title={q || groupId ? "No students match" : "No students yet"}
          description={q || groupId ? "Try a different search or filter." : "Create a group and share the invite code — students appear here when they join."}
          action={!q && !groupId ? <ButtonLink href="/mentor/groups">Go to groups</ButtonLink> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((s) => {
            const p = s.studentProfile;
            return (
              <Link key={s.id} href={`/mentor/students/${s.id}`} className="block">
                <Card className="card-hover h-full transition-all hover:border-primary-200">
                  <CardBody>
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-secondary-600 text-sm font-bold text-white">
                        {initials(s.fullName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-ink">{s.fullName}</p>
                        <p className="truncate text-xs text-slate-400">{p?.college ?? s.email}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Badge tone="warning"><Zap className="h-3 w-3" /> {p?.totalPoints ?? 0}</Badge>
                      {p && p.currentStreak > 0 ? <Badge tone="danger"><Flame className="h-3 w-3" /> {p.currentStreak}d</Badge> : null}
                      <Badge tone="info">{p?.testsCompleted ?? 0} tests</Badge>
                      <Badge tone="success">{p?.tasksCompleted ?? 0} tasks</Badge>
                    </div>
                    <div className="mt-3 space-y-0.5">
                      {s.groups.map((g) => (
                        <p key={g} className="truncate text-xs text-slate-400">👥 {g}</p>
                      ))}
                    </div>
                    <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary-600">
                      View progress <ArrowRight className="h-3.5 w-3.5" />
                    </p>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-xs text-slate-400">Sorted by join date · {students.length} student{students.length === 1 ? "" : "s"} · data as of {formatDate(new Date())}</p>
    </>
  );
}
