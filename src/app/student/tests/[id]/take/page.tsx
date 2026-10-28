import { notFound, redirect } from "next/navigation";
import { requireStudent, isGroupMember } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { gradeAndStoreAttempt } from "@/lib/test-grading";
import { ExamRunner, AttemptGate } from "./exam-runner";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function TakeTestPage({ params }: Props) {
  const { id: testId } = await params;
  const user = await requireStudent();

  const test = await prisma.test.findUnique({
    where: { id: testId },
    select: {
      id: true, title: true, durationMin: true, passingScore: true, groupId: true,
      availableFrom: true, availableUntil: true,
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true, type: true, prompt: true, marks: true,
          options: { orderBy: { order: "asc" }, select: { id: true, text: true } },
        },
      },
    },
  });
  if (!test) notFound();
  if (!(await isGroupMember(user.id, test.groupId))) redirect(`/student/tests/${testId}`);

  const attempt = await prisma.testAttempt.findFirst({
    where: { testId, studentId: user.id, status: "IN_PROGRESS" },
    orderBy: { startedAt: "desc" },
    include: {
      answers: { select: { questionId: true, selectedOptionIds: true, textAnswer: true, codeAnswer: true } },
    },
  });

  // No attempt yet → gate component starts one via the server action.
  if (!attempt) return <AttemptGate testId={testId} />;

  const GRACE_MS = 5 * 60 * 1000;
  const deadline = attempt.startedAt.getTime() + test.durationMin * 60 * 1000;
  const remainingSec = Math.max(0, Math.floor((deadline - Date.now()) / 1000));

  // Past the grace window: grade server-side and send to results.
  if (Date.now() > deadline + GRACE_MS) {
    await gradeAndStoreAttempt(attempt.id);
    redirect(`/student/tests/${testId}`);
  }

  return (
    <ExamRunner
      testId={test.id}
      testTitle={test.title}
      attemptId={attempt.id}
      durationMin={test.durationMin}
      remainingSec={remainingSec}
      questions={test.questions.map((q) => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        marks: q.marks,
        options: q.options.map((o) => ({ id: o.id, text: o.text })),
      }))}
      initialAnswers={attempt.answers.map((a) => ({
        questionId: a.questionId,
        selectedOptionIds: safeArray(a.selectedOptionIds),
        textAnswer: a.textAnswer,
        codeAnswer: a.codeAnswer,
      }))}
    />
  );
}

function safeArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
