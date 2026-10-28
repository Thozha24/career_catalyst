import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ListChecks, Users, CalendarClock, Zap } from "lucide-react";
import { requireMentor, isGroupMentor } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody, Badge, EmptyState } from "@/components/ui";
import { formatDate, formatDateTime, initials } from "@/lib/format";
import { ReviewCard } from "./review-card";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const STATUS_TONE: Record<string, "neutral" | "info" | "warning" | "success" | "danger"> = {
  NOT_STARTED: "neutral",
  IN_PROGRESS: "info",
  SUBMITTED: "warning",
  REVIEWED: "info",
  COMPLETED: "success",
  RESUBMIT: "danger",
};

export default async function MentorTaskDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requireMentor();

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      group: { select: { id: true, name: true } },
      assignments: {
        include: {
          student: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
  if (!task) notFound();
  if (!(await isGroupMentor(user.id, task.groupId)) && task.createdBy !== user.id) notFound();

  const submissions = await prisma.taskSubmission.findMany({
    where: { taskId: id },
    include: { student: { select: { id: true, fullName: true } } },
  });
  const subByStudent = new Map(submissions.map((s) => [s.studentId, s]));

  let resources: { name: string; url: string }[] = [];
  try {
    const parsed = JSON.parse(task.resources);
    if (Array.isArray(parsed)) resources = parsed;
  } catch {
    resources = [];
  }

  const statusCounts = task.assignments.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <Link href="/mentor/tasks" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-600">
        <ArrowLeft className="h-4 w-4" /> All tasks
      </Link>

      <PageHeader
        eyebrow={task.group.name}
        title={task.title}
        description={task.description}
        action={
          <div className="flex flex-wrap gap-2">
            <Badge tone={task.priority === "HIGH" ? "danger" : task.priority === "MEDIUM" ? "warning" : "neutral"}>{task.priority}</Badge>
            <Badge tone="warning"><Zap className="h-3 w-3" /> up to {task.pointsAward} pts</Badge>
            <Badge tone="neutral"><CalendarClock className="h-3 w-3" /> Due {formatDate(task.dueDate)}</Badge>
          </div>
        }
      />

      {task.instructions ? (
        <Card className="mb-6">
          <CardHeader title="Instructions given to students" icon={<ListChecks className="h-4 w-4" />} />
          <CardBody>
            <div className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">{task.instructions}</div>
            {resources.length > 0 ? (
              <ul className="mt-3 space-y-1">
                {resources.map((r) => (
                  <li key={r.url}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary-600 hover:underline">🔗 {r.name}</a>
                  </li>
                ))}
              </ul>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      {/* Status overview */}
      <Card className="mb-6">
        <CardHeader title="Assignment status" subtitle={`${task.assignments.length} students`} icon={<Users className="h-4 w-4" />} />
        <CardBody className="flex flex-wrap gap-2">
          {Object.entries(statusCounts).map(([status, count]) => (
            <Badge key={status} tone={STATUS_TONE[status] ?? "neutral"}>
              {status.replaceAll("_", " ").toLowerCase()}: {count}
            </Badge>
          ))}
          {task.assignments.length === 0 ? <p className="text-sm text-slate-400">No active members in this group.</p> : null}
        </CardBody>
      </Card>

      {/* Submissions */}
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Submissions & reviews</h2>
      {submissions.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="h-6 w-6" />}
          title="No submissions yet"
          description="Students' work appears here as they submit. They were all notified when the task was assigned."
        />
      ) : (
        <div className="space-y-4">
          {submissions.map((s) => (
            <ReviewCard
              key={s.id}
              submission={{
                id: s.id,
                studentName: s.student.fullName,
                content: s.content,
                fileUrl: s.fileUrl,
                status: s.status,
                pointsAwarded: s.pointsAwarded,
                feedback: s.feedback,
                submittedAt: s.submittedAt.toISOString(),
                reviewedAt: s.reviewedAt ? s.reviewedAt.toISOString() : null,
              }}
              maxPoints={task.pointsAward}
            />
          ))}
        </div>
      )}

      {/* Students who haven't submitted */}
      {task.assignments.filter((a) => !subByStudent.has(a.studentId)).length > 0 ? (
        <Card className="mt-6">
          <CardHeader title="Not yet submitted" icon={<Users className="h-4 w-4" />} />
          <CardBody className="flex flex-wrap gap-2">
            {task.assignments
              .filter((a) => !subByStudent.has(a.studentId))
              .map((a) => (
                <span key={a.id} className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-600">
                    {initials(a.student.fullName)}
                  </span>
                  {a.student.fullName} · {a.status === "RESUBMIT" ? "resubmit requested" : a.status.replaceAll("_", " ").toLowerCase()}
                  <span className="text-slate-300">· {formatDateTime(a.updatedAt)}</span>
                </span>
              ))}
          </CardBody>
        </Card>
      ) : null}
    </>
  );
}
