import Link from "next/link";
import { ListChecks, Plus, CalendarClock, Users, FileCheck2 } from "lucide-react";
import { requireMentor } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, Badge, ButtonLink, EmptyState } from "@/components/ui";
import { formatDate, formatRelative } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MentorTasksPage() {
  const user = await requireMentor();

  const tasks = await prisma.task.findMany({
    where: { createdBy: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      group: { select: { id: true, name: true, _count: { select: { members: { where: { isActive: true } } } } } },
      _count: { select: { submissions: true } },
      submissions: { where: { status: "SUBMITTED", reviewedAt: null }, select: { id: true } },
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="Teaching"
        title="Tasks"
        description="Assign work to your groups, review submissions, give feedback and award points."
        action={
          <ButtonLink href="/mentor/tasks/new">
            <Plus className="h-4 w-4" /> Create Task
          </ButtonLink>
        }
      />

      {tasks.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="h-6 w-6" />}
          title="No tasks yet"
          description="Create a task — every active group member gets it instantly with a notification."
          action={<ButtonLink href="/mentor/tasks/new">Create your first task</ButtonLink>}
        />
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => {
            const awaiting = t.submissions.length;
            return (
              <Link key={t.id} href={`/mentor/tasks/${t.id}`} className="block">
                <Card className="card-hover transition-all hover:border-primary-200">
                  <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-ink">{t.title}</h3>
                        <Badge tone={t.priority === "HIGH" ? "danger" : t.priority === "MEDIUM" ? "warning" : "neutral"}>{t.priority}</Badge>
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-slate-500">{t.description}</p>
                      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {t.group.name}</span>
                        <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> Due {formatDate(t.dueDate)}</span>
                        <span className="text-warning-600">{t.pointsAward} points</span>
                        <span className="inline-flex items-center gap-1"><FileCheck2 className="h-3.5 w-3.5" /> {t._count.submissions} submissions</span>
                        {formatRelative(t.createdAt)}
                      </p>
                    </div>
                    {awaiting > 0 ? <Badge tone="warning" className="shrink-0">{awaiting} to review</Badge> : <Badge tone="success" className="shrink-0">All reviewed</Badge>}
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
