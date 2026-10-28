import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ClipboardList, Users, Target, Trophy, Clock,
  PenLine, CheckCircle2,
} from "lucide-react";
import { requireMentor, isGroupMentor } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody, Badge, StatCard, Progress, EmptyState, ButtonLink } from "@/components/ui";
import { formatDateTime, formatDuration, initials } from "@/lib/format";
import { AwaitingGrading, GradeTable } from "./grade-panel";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function MentorTestDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requireMentor();

  const test = await prisma.test.findUnique({
    where: { id },
    include: {
      group: { select: { id: true, name: true, _count: { select: { members: { where: { isActive: true } } } } } },
      questions: { orderBy: { order: "asc" }, include: { options: { orderBy: { order: "asc" } } } },
      attempts: {
        orderBy: { startedAt: "asc" },
        include: {
          student: { select: { id: true, fullName: true, email: true } },
          answers: { select: { questionId: true, isCorrect: true, marksAwarded: true, textAnswer: true, codeAnswer: true, selectedOptionIds: true } },
        },
      },
    },
  });
  if (!test) notFound();

  const owns = await isGroupMentor(user.id, test.groupId) || test.createdBy === user.id;
  if (!owns) notFound();

  const submitted = test.attempts.filter((a) => a.status === "SUBMITTED");
  const avg = submitted.length ? Math.round(submitted.reduce((s, a) => s + (a.percentage ?? 0), 0) / submitted.length) : 0;
  const passedCount = submitted.filter((a) => a.passed).length;
  const hasManual = test.questions.some((q) => q.type === "SHORT_ANSWER" || q.type === "CODING");

  return (
    <>
      <Link href="/mentor/tests" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-600">
        <ArrowLeft className="h-4 w-4" /> All tests
      </Link>

      <PageHeader
        eyebrow={test.group.name}
        title={test.title}
        description={test.description ?? undefined}
        action={<Badge tone="primary"><ClipboardList className="h-3 w-3" /> {test.durationMin} min · pass {test.passingScore}%</Badge>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Assigned to" value={`${test.group._count.members} students`} icon={<Users className="h-5 w-5" />} tone="primary" />
        <StatCard label="Submitted" value={`${submitted.length}/${test.group._count.members}`} icon={<FileCheck />} hint={`${Math.round((submitted.length / Math.max(1, test.group._count.members)) * 100)}% participation`} tone="info" />
        <StatCard label="Average score" value={submitted.length ? `${avg}%` : "—"} icon={<Target className="h-5 w-5" />} hint={`${passedCount} passed`} tone="success" />
        <StatCard label="Questions" value={test.questions.length} icon={<Trophy className="h-5 w-5" />} hint={hasManual ? "Includes manual grading" : "Fully auto-graded"} tone="warning" />
      </div>

      {submitted.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Clock className="h-6 w-6" />}
            title="No submissions yet"
            description="Students see this test in their dashboard. Results appear here as they submit."
            action={<ButtonLink href={`/mentor/groups/${test.groupId}`} variant="outline">View group</ButtonLink>}
          />
        </div>
      ) : (
        <>
          {hasManual ? (
            <Card className="mt-6 border-warning-200 bg-warning-50/40">
              <CardBody className="flex items-start gap-3">
                <PenLine className="mt-0.5 h-5 w-5 shrink-0 text-warning-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">Manual grading needed</p>
                  <p className="text-sm text-slate-600">Short-answer and coding questions must be marked by hand. Objective questions were already graded automatically.</p>
                </div>
              </CardBody>
            </Card>
          ) : null}

          <div className="mt-6">
            <GradeTable
              testId={test.id}
              passingScore={test.passingScore}
              questions={test.questions.map((q) => ({
                id: q.id,
                type: q.type,
                prompt: q.prompt,
                marks: q.marks,
                manual: q.type === "SHORT_ANSWER" || q.type === "CODING",
                options: q.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
              }))}
              attempts={submitted.map((a) => ({
                id: a.id,
                studentId: a.student.id,
                studentName: a.student.fullName,
                percentage: a.percentage ?? 0,
                passed: !!a.passed,
                timeTakenSec: a.timeTakenSec,
                score: a.score ?? 0,
                maxScore: test.questions.reduce((s, q) => s + q.marks, 0) || null,
                answers: a.answers.map((ans) => ({
                  questionId: ans.questionId,
                  isCorrect: ans.isCorrect,
                  marksAwarded: ans.marksAwarded,
                  textAnswer: ans.textAnswer,
                  codeAnswer: ans.codeAnswer,
                })),
              }))}
            />
          </div>
        </>
      )}
    </>
  );
}

function FileCheck({ className }: { className?: string }) {
  return <CheckCircle2 className={className} />;
}
