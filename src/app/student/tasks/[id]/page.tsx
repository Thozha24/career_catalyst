import { notFound } from "next/navigation";
import { Calendar, Zap, FileText, Link2, MessageSquareQuote, Clock } from "lucide-react";
import { requireStudent } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody, Badge, Alert } from "@/components/ui";
import { formatDate, formatDateTime, formatRelative } from "@/lib/format";
import { TaskWorkForm } from "./task-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const PRIORITY_TONE = { HIGH: "danger", MEDIUM: "warning", LOW: "neutral" } as const;

export default async function StudentTaskDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requireStudent();

  const assignment = await prisma.taskAssignment.findUnique({
    where: { taskId_studentId: { taskId: id, studentId: user.id } },
    include: {
      task: {
        include: {
          group: { select: { name: true, mentor: { select: { fullName: true } } } },
        },
      },
      student: { select: { id: true } },
    },
  });
  if (!assignment) notFound();

  const { task } = assignment;
  const submission = await prisma.taskSubmission.findUnique({
    where: { taskId_studentId: { taskId: id, studentId: user.id } },
  });

  const canEdit = ["NOT_STARTED", "IN_PROGRESS", "RESUBMIT"].includes(assignment.status);
  const overdue = task.dueDate && task.dueDate < new Date();

  let resources: { name: string; url: string }[] = [];
  try {
    const parsed = JSON.parse(task.resources);
    if (Array.isArray(parsed)) resources = parsed.map((r) => ({ name: String(r?.name ?? "Resource"), url: String(r?.url ?? "") })).filter((r) => r.url);
  } catch {
    resources = [];
  }

  return (
    <>
      <PageHeader
        eyebrow={task.group.name}
        title={task.title}
        description={task.description}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={PRIORITY_TONE[task.priority]}>{task.priority} priority</Badge>
            <Badge tone="warning"><Zap className="h-3 w-3" /> {task.pointsAward} points</Badge>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Instructions */}
          <Card>
            <CardHeader title="Details" icon={<FileText className="h-4 w-4" />} />
            <CardBody className="space-y-4">
              {task.instructions ? (
                <div className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">{task.instructions}</div>
              ) : (
                <p className="text-sm text-slate-500">Follow the description above. Ask your mentor if anything is unclear.</p>
              )}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Due {formatDate(task.dueDate)}</span>
                <span className="inline-flex items-center gap-1.5">Mentor: {task.group.mentor.fullName}</span>
              </div>
              {overdue && canEdit ? (
                <Alert tone="warning">This task is past its due date — submit as soon as you can and let your mentor know.</Alert>
              ) : null}
              {resources.length > 0 ? (
                <div>
                  <p className="label-base">Resources</p>
                  <ul className="mt-1 space-y-1.5">
                    {resources.map((r) => (
                      <li key={r.url}>
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline">
                          <Link2 className="h-3.5 w-3.5" /> {r.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardBody>
          </Card>

          {/* Submission / form */}
          {canEdit ? (
            <Card>
              <CardHeader
                title={submission ? "Update your submission" : "Submit your work"}
                subtitle={submission ? `Last submitted ${formatRelative(submission.submittedAt)}` : "Paste your work or a link below"}
                icon={<FileText className="h-4 w-4" />}
              />
              <CardBody>
                {assignment.status === "RESUBMIT" && submission?.feedback ? (
                  <div className="mb-4">
                    <Alert tone="warning" title="Your mentor requested changes">
                      {submission.feedback}
                    </Alert>
                  </div>
                ) : null}
                <TaskWorkForm taskId={task.id} defaultContent={submission?.content ?? ""} defaultFileUrl={submission?.fileUrl ?? ""} />
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardHeader
                title="Your submission"
                subtitle={submission ? `Submitted ${formatDateTime(submission.submittedAt)}` : undefined}
                icon={<FileText className="h-4 w-4" />}
                action={<Badge tone={submission?.status === "COMPLETED" ? "success" : "warning"}>{submission?.status === "COMPLETED" ? "Completed" : "Awaiting review"}</Badge>}
              />
              <CardBody className="space-y-4">
                {submission ? (
                  <>
                    <div className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">{submission.content}</div>
                    {submission.fileUrl ? (
                      <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:underline">
                        <Link2 className="h-4 w-4" /> Attached link
                      </a>
                    ) : null}
                    {submission.feedback ? (
                      <div className="rounded-xl border border-primary-100 bg-primary-50/60 p-4">
                        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary-700">
                          <MessageSquareQuote className="h-3.5 w-3.5" /> Mentor feedback
                        </p>
                        <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">{submission.feedback}</p>
                        {submission.pointsAwarded > 0 ? (
                          <p className="mt-2 text-sm font-semibold text-success-700">+{submission.pointsAwarded} points awarded ⚡</p>
                        ) : null}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm text-slate-500">No submission recorded yet.</p>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar: status timeline */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Status" icon={<Clock className="h-4 w-4" />} />
            <CardBody>
              <ol className="space-y-4">
                {[
                  { key: "NOT_STARTED", label: "Not started" },
                  { key: "IN_PROGRESS", label: "In progress" },
                  { key: "SUBMITTED", label: "Submitted" },
                  { key: "REVIEWED", label: "Reviewed" },
                  { key: "COMPLETED", label: "Completed" },
                ].map((step, i, arr) => {
                  const order = ["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "REVIEWED", "COMPLETED"];
                  const currentIdx = order.indexOf(assignment.status === "RESUBMIT" ? "IN_PROGRESS" : assignment.status);
                  const reached = i <= currentIdx;
                  const isCurrent = i === currentIdx;
                  return (
                    <li key={step.key} className="relative flex items-start gap-3">
                      {!reached || i === arr.length - 1 ? null : <span className="absolute left-[7px] top-5 h-full w-px bg-slate-200" aria-hidden />}
                      <span
                        className={`relative z-10 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                          isCurrent ? "bg-primary-600 ring-4 ring-primary-100" : reached ? "bg-success-500" : "bg-slate-200"
                        }`}
                      />
                      <div>
                        <p className={`text-sm font-semibold ${isCurrent ? "text-primary-700" : reached ? "text-ink" : "text-slate-400"}`}>{step.label}</p>
                        {isCurrent && assignment.status === "RESUBMIT" ? <p className="text-xs text-warning-700">Changes requested by your mentor</p> : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-sm text-slate-500">
              <p className="font-semibold text-ink">How points work</p>
              <p className="mt-1">When your mentor marks this task complete, up to {task.pointsAward} points are credited by the platform — mentors can award any amount up to that.</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
