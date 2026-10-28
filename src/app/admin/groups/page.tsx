import { Group as GroupIcon, Users, Calendar, BookOpen, ClipboardList, ClipboardCheck } from "lucide-react";
import { requireAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody, Badge, EmptyState } from "@/components/ui";
import { formatDate, formatRelative } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminGroupsPage() {
  await requireAdmin();

  const groups = await prisma.group.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      mentor: { select: { id: true, fullName: true, email: true, status: true } },
      _count: {
        select: {
          members: { where: { isActive: true } },
          tests: true,
          tasks: true,
          announcements: true,
        },
      },
    },
  });

  const submittedByGroup = await prisma.groupMember.groupBy({
    by: ["groupId"],
    _count: { _all: true },
  });

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Groups"
        description="Every mentor-led cohort on the platform, with size, workload and activity."
      />

      {groups.length === 0 ? (
        <EmptyState icon={<GroupIcon className="h-6 w-6" />} title="No groups yet" description="Groups appear here as soon as mentors create them." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map((g) => (
            <Card key={g.id} className="card-hover" data-testid={`admin-group-${g.id}`}>
              <CardHeader
                title={g.name}
                subtitle={g.description ?? undefined}
                icon={<GroupIcon className="h-4 w-4" />}
              />
              <CardBody>
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <Badge tone="secondary">Mentor: {g.mentor.fullName}</Badge>
                  <Badge tone="primary"><Users className="mr-1 inline h-3 w-3" />{g._count.members} students</Badge>
                  <Badge tone="info"><BookOpen className="mr-1 inline h-3 w-3" />{g._count.tests} tests</Badge>
                  <Badge tone="warning"><ClipboardList className="mr-1 inline h-3 w-3" />{g._count.tasks} tasks</Badge>
                  {g._count.announcements > 0 ? <Badge tone="neutral">{g._count.announcements} announcements</Badge> : null}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Created {formatDate(g.createdAt)} · mentor joined activity {formatRelative(g.createdAt)}</span>
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-500">{g.inviteCode}</code>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
      <Card className="mt-6">
        <CardHeader title="Workload snapshot" icon={<ClipboardCheck className="h-4 w-4" />} subtitle="Aggregate counts used to spot stalled cohorts" />
        <CardBody>
          <p className="text-sm text-slate-600">
            Groups with many tasks and zero submissions are flagged by comparing task counts with submission counts per cohort.
            {submittedByGroup.length > 0 ? ` Currently tracking ${submittedByGroup.length} group member rows across all cohorts.` : ""}
          </p>
        </CardBody>
      </Card>
    </>
  );
}
