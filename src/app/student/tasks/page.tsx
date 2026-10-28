import Link from "next/link";
import { ListChecks, Calendar, Zap, CircleDot, Circle, Send, RotateCcw } from "lucide-react";
import { requireStudent } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, Badge, ButtonLink, EmptyState } from "@/components/ui";
import { formatDate, formatRelative } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_META: Record<string, { label: string; tone: "neutral" | "info" | "warning" | "success" | "danger" }> = {
  NOT_STARTED: { label: "Not started", tone: "neutral" },
  IN_PROGRESS: { label: "In progress", tone: "info" },
  SUBMITTED: { label: "Submitted", tone: "warning" },
  REVIEWED: { label: "Reviewed", tone: "info" },
  COMPLETED: { label: "Completed", tone: "success" },
  RESUBMIT: { label: "Resubmit requested", tone: "danger" },
};

export default async function StudentTasksPage() {
  const user = await requireStudent();

  const assignments = await prisma.taskAssignment.findMany({
    where: { studentId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      task: {
        select: {
          id: true, title: true, description: true, dueDate: true, priority: true, pointsAward: true,
          group: { select: { name: true } },
        },
      },
    },
  });

  const open = assignments.filter((a) => ["NOT_STARTED", "IN_PROGRESS", "RESUBMIT"].includes(a.status));
  const done = assignments.filter((a) => ["SUBMITTED", "REVIEWED", "COMPLETED"].includes(a.status));
  const earnedPoints = assignments.reduce((s, a) => s + (a.task.pointsAward && a.status === "COMPLETED" ? 1 : 0), 0);

  return (
    <>
      <PageHeader
        eyebrow="Mentorship"
        title="Tasks"
        description="Assignments from your mentor. Submit your work and earn points when it's approved."
      />

      {assignments.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="h-6 w-6" />}
          title="No tasks yet"
          description="When your mentor assigns tasks they'll show up here. Join a mentor group to get started."
          action={<ButtonLink href="/student/group">Join a Group</ButtonLink>}
        />
      ) : (
        <div className="space-y-6">
          {/* Open */}
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">To do ({open.length})</h2>
            {open.length === 0 ? (
              <Card><CardBody className="text-sm text-slate-500">All caught up — nothing pending. 🎉</CardBody></Card>
            ) : (
              <div className="space-y-3">
                {open.map(({ task, status }) => {
                  const meta = STATUS_META[status] ?? STATUS_META.NOT_STARTED;
                  const overdue = task.dueDate && task.dueDate < new Date() && status !== "COMPLETED";
                  return (
                    <Link key={task.id} href={`/student/tasks/${task.id}`} className="block">
                      <Card className="card-hover transition-all hover:border-primary-200">
                        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-ink">{task.title}</h3>
                              <Badge tone={task.priority === "HIGH" ? "danger" : task.priority === "MEDIUM" ? "warning" : "neutral"}>
                                {task.priority}
                              </Badge>
                              <Badge tone={meta.tone}>{meta.label}</Badge>
                            </div>
                            <p className="mt-1 line-clamp-1 text-sm text-slate-500">{task.description}</p>
                            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                              <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Due {formatDate(task.dueDate)}</span>
                              <span className="inline-flex items-center gap-1 text-warning-600"><Zap className="h-3.5 w-3.5" /> {task.pointsAward} points</span>
                              {overdue ? <span className="font-semibold text-danger-600">Overdue</span> : null}
                            </p>
                          </div>
                          <span className="shrink-0">
                            {status === "RESUBMIT" ? (
                              <span className="inline-flex items-center gap-1.5 rounded-xl bg-warning-50 px-4 py-2 text-sm font-semibold text-warning-700 ring-1 ring-inset ring-warning-100">
                                <RotateCcw className="h-4 w-4" /> Resubmit
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 ring-1 ring-inset ring-primary-100">
                                <Send className="h-4 w-4" /> Open task
                              </span>
                            )}
                          </span>
                        </CardBody>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Completed / submitted */}
          {done.length > 0 ? (
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Submitted & completed ({done.length})</h2>
              <div className="space-y-2">
                {done.map(({ task, status }) => {
                  const meta = STATUS_META[status] ?? STATUS_META.SUBMITTED;
                  return (
                    <Link key={task.id} href={`/student/tasks/${task.id}`} className="block">
                      <Card className="transition-all hover:border-primary-200">
                        <CardBody className="flex items-center justify-between gap-3 py-3.5">
                          <div className="flex min-w-0 items-center gap-3">
                            {status === "COMPLETED" ? (
                              <CircleDot className="h-4 w-4 shrink-0 text-success-500" />
                            ) : (
                              <Circle className="h-4 w-4 shrink-0 text-slate-300" />
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-ink">{task.title}</p>
                              <p className="text-xs text-slate-400">{task.group.name} · {task.pointsAward} pts</p>
                            </div>
                          </div>
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                        </CardBody>
                      </Card>
                    </Link>
                  );
                })}
              </div>
              {earnedPoints > 0 ? (
                <p className="mt-3 text-xs text-slate-400">
                  {earnedPoints} task{earnedPoints === 1 ? "" : "s"} completed so far — keep it up! · Updated {formatRelative(new Date())}
                </p>
              ) : null}
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}
