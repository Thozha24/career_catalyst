import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ClipboardList, Timer, CalendarClock, CheckCircle2, XCircle, Clock,
  Trophy, ArrowLeft, Users, PlayCircle, AlertTriangle, ListChecks,
} from "lucide-react";
import { requireStudent, isGroupMember } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody, Badge, ButtonLink, EmptyState, Progress } from "@/components/ui";
import { formatDateTime, formatDuration } from "@/lib/format";
import { safeParseArray } from "@/lib/test-grading";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const TYPE_LABEL: Record<string, string> = {
  MCQ: "Multiple choice",
  MULTI_SELECT: "Multiple select",
  TRUE_FALSE: "True / false",
  SHORT_ANSWER: "Short answer",
  CODING: "Coding",
};

export default async function StudentTestDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requireStudent();

  const test = await prisma.test.findUnique({
    where: { id },
    include: {
      group: { select: { id: true, name: true, mentor: { select: { fullName: true } } } },
      questions: { orderBy: { order: "asc" }, include: { options: { orderBy: { order: "asc" } } } },
      attempts: { where: { studentId: user.id }, orderBy: { attemptNo: "asc" }, include: { answers: true } },
    },
  });
  if (!test || !test.isActive) notFound();

  const member = await isGroupMember(user.id, test.groupId);
  if (!member) {
    return (
      <EmptyState
        icon={<Users className="h-6 w-6" />}
        title="Not available to you"
        description="This test belongs to a group you are not a member of."
        action={<ButtonLink href="/student/tests" variant="outline">Back to tests</ButtonLink>}
      />
    );
  }

  const submitted = test.attempts
    .filter((a) => a.status === "SUBMITTED")
    .sort((a, b) => (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0));
  const inProgress = test.attempts.find((a) => a.status === "IN_PROGRESS");
  const latest = submitted[0];
  const now = new Date();
  const isClosed = !!(test.availableUntil && now > test.availableUntil);
  const notOpenYet = !!(test.availableFrom && now < test.availableFrom);
  const windowLabel =
    test.availableFrom || test.availableUntil
      ? `${formatDateTime(test.availableFrom)} — ${formatDateTime(test.availableUntil)}`
      : "Always available";

  return (
    <>
      <Link href="/student/tests" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-600">
        <ArrowLeft className="h-4 w-4" /> All tests
      </Link>

      <PageHeader
        eyebrow={test.group.name}
        title={test.title}
        description={test.description ?? undefined}
        action={
          inProgress ? (
            <ButtonLink href={`/student/tests/${test.id}/take`} variant="warning" size="lg">
              <PlayCircle className="h-4 w-4" /> Resume Test
            </ButtonLink>
          ) : !latest && !isClosed && !notOpenYet ? (
            <StartTestButton testId={test.id} />
          ) : null
        }
      />

      {notOpenYet ? (
        <div className="mb-6">
          <Card><CardBody className="flex items-center gap-3 text-sm text-info-800 bg-info-50 rounded-xl">
            <Clock className="h-4 w-4 shrink-0" /> This test opens {formatDateTime(test.availableFrom)}.
          </CardBody></Card>
        </div>
      ) : null}

      {/* Meta */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500"><Timer className="h-3.5 w-3.5" /> Duration</p>
          <p className="mt-1 text-xl font-bold text-ink">{test.durationMin} min</p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500"><ListChecks className="h-3.5 w-3.5" /> Questions</p>
          <p className="mt-1 text-xl font-bold text-ink">{test.questions.length}</p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500"><Trophy className="h-3.5 w-3.5" /> Passing score</p>
          <p className="mt-1 text-xl font-bold text-ink">{test.passingScore}%</p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500"><CalendarClock className="h-3.5 w-3.5" /> Window</p>
          <p className="mt-1 text-sm font-semibold text-ink">{windowLabel}</p>
          {test.negativeMarking ? <p className="mt-0.5 text-xs text-danger-600">Negative marking active</p> : null}
        </Card>
      </div>

      {/* Results */}
      {latest ? (
        <Card className="mt-6">
          <CardHeader
            title={latest.passed ? "Passed 🎉" : "Attempt result"}
            subtitle={`Attempt ${latest.attemptNo} · submitted ${formatDateTime(latest.submittedAt)}`}
            icon={<Trophy className="h-4 w-4" />}
            action={
              <Badge tone={latest.passed ? "success" : "danger"}>
                {latest.percentage}% · {latest.passed ? "Passed" : "Below passing score"}
              </Badge>
            }
          />
          <CardBody className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Score</p>
                <p className="text-2xl font-bold text-ink">{latest.score ?? 0}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Percentage</p>
                <p className="text-2xl font-bold text-ink">{latest.percentage}%</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Time taken</p>
                <p className="text-2xl font-bold text-ink">{latest.timeTakenSec != null ? formatDuration(latest.timeTakenSec) : "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Pass mark</p>
                <p className="text-2xl font-bold text-ink">{test.passingScore}%</p>
              </div>
            </div>
            <Progress value={latest.percentage ?? 0} tone={latest.passed ? "success" : "danger"} />

            {/* Question-level performance */}
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Question review</h3>
              <div className="space-y-4">
                {test.questions.map((q, qi) => {
                  const answer = latest.answers.find((a) => a.questionId === q.id);
                  const selectedIds = safeParseArray(answer?.selectedOptionIds ?? "[]");
                  const auto = q.type === "MCQ" || q.type === "MULTI_SELECT" || q.type === "TRUE_FALSE";
                  const pendingReview = !auto && answer?.isCorrect === undefined;
                  return (
                    <div key={q.id} className="rounded-xl border border-slate-100 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-ink">{qi + 1}. {q.prompt}</p>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge tone="neutral">{TYPE_LABEL[q.type]}</Badge>
                          {answer?.isCorrect === true ? (
                            <Badge tone="success"><CheckCircle2 className="h-3 w-3" /> +{answer.marksAwarded}/{q.marks}</Badge>
                          ) : answer?.isCorrect === false ? (
                            <Badge tone="danger"><XCircle className="h-3 w-3" /> {answer.marksAwarded}/{q.marks}</Badge>
                          ) : pendingReview ? (
                            <Badge tone="warning"><Clock className="h-3 w-3" /> In review</Badge>
                          ) : (
                            <Badge tone="neutral">Not answered</Badge>
                          )}
                        </div>
                      </div>

                      {q.options.length > 0 ? (
                        <ul className="mt-3 space-y-1.5">
                          {q.options.map((opt) => {
                            const selected = selectedIds.includes(opt.id);
                            const isCorrectOpt = opt.isCorrect;
                            return (
                              <li
                                key={opt.id}
                                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${
                                  isCorrectOpt
                                    ? "bg-success-50 font-medium text-success-800 ring-1 ring-inset ring-success-100"
                                    : selected
                                      ? "bg-danger-50 text-danger-800 ring-1 ring-inset ring-danger-100"
                                      : "text-slate-500"
                                }`}
                              >
                                {isCorrectOpt ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : selected ? <XCircle className="h-3.5 w-3.5 shrink-0" /> : <span className="h-3.5 w-3.5 shrink-0" />}
                                {opt.text}
                                {selected ? <span className="ml-auto text-[11px] font-semibold uppercase text-slate-400">Your answer</span> : null}
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}

                      {q.type === "SHORT_ANSWER" && answer?.textAnswer ? (
                        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">“{answer.textAnswer}”</p>
                      ) : null}
                      {q.type === "CODING" && answer?.codeAnswer ? (
                        <pre className="code-editor mt-3 overflow-x-auto rounded-lg p-3 text-xs">{answer.codeAnswer}</pre>
                      ) : null}
                      {pendingReview ? (
                        <p className="mt-3 text-xs text-warning-700">Short-answer and coding questions are graded manually by your mentor.</p>
                      ) : null}
                      {!auto && q.explanation && !pendingReview ? (
                        <p className="mt-2 text-xs text-slate-500">Mentor note: {q.explanation}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {/* Not started / closed guidance */}
      {!latest && !inProgress ? (
        <Card className="mt-6">
          <CardBody className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              {isClosed ? <AlertTriangle className="mt-0.5 h-5 w-5 text-warning-500" /> : <ClipboardList className="mt-0.5 h-5 w-5 text-primary-500" />}
              <div>
                <p className="text-sm font-semibold text-ink">{isClosed ? "The window for this test has closed" : "You haven't taken this test yet"}</p>
                <p className="text-sm text-slate-500">
                  {isClosed
                    ? "It closed " + formatDateTime(test.availableUntil) + ". Contact your mentor if you think this is a mistake."
                    : `${test.questions.length} questions · ${test.durationMin} minutes · answers autosave automatically.`}
                </p>
              </div>
            </div>
            {!isClosed && !notOpenYet ? <StartTestButton testId={test.id} /> : null}
          </CardBody>
        </Card>
      ) : null}

      {inProgress ? (
        <Card className="mt-6 border-warning-200 bg-warning-50/60">
          <CardBody className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Attempt in progress</p>
              <p className="text-sm text-slate-600">Started {formatDateTime(inProgress.startedAt)} — the timer is running. Resume to finish and submit.</p>
            </div>
            <ButtonLink href={`/student/tests/${test.id}/take`} variant="warning">Resume Test</ButtonLink>
          </CardBody>
        </Card>
      ) : null}
    </>
  );
}

function StartTestButton({ testId }: { testId: string }) {
  return (
    <ButtonLink href={`/student/tests/${testId}/take`} size="lg">
      <PlayCircle className="h-4 w-4" /> Start Test
    </ButtonLink>
  );
}
