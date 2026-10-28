import "server-only";
import { prisma } from "./prisma";
import { scoreAttempt, type ScoringQuestion, type StudentAnswer } from "./scoring";
import { awardPoints, touchStreak } from "./points";
import { checkAchievements } from "./achievements";

/**
 * Grades a test attempt entirely on the server from stored questions +
 * stored answers. Client-reported scores are ignored by design.
 * Returns the persisted attempt summary.
 */
export async function gradeAndStoreAttempt(attemptId: string): Promise<{
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
} | null> {
  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      test: { select: { id: true, passingScore: true, negativeMarking: true } },
      answers: true,
    },
  });
  if (!attempt) return null;
  if (attempt.status !== "IN_PROGRESS") {
    return {
      score: attempt.score ?? 0,
      maxScore: 0,
      percentage: attempt.percentage ?? 0,
      passed: !!attempt.passed,
    };
  }

  const questions = await prisma.testQuestion.findMany({
    where: { testId: attempt.testId },
    include: { options: { select: { id: true, text: true, isCorrect: true } } },
    orderBy: { order: "asc" },
  });

  const scoringQuestions: ScoringQuestion[] = questions.map((q) => ({
    id: q.id,
    type: q.type,
    marks: q.marks,
    negativeMarks: q.negativeMarks,
    options: q.options,
    explanation: q.explanation,
  }));
  const studentAnswers: StudentAnswer[] = attempt.answers.map((a) => ({
    questionId: a.questionId,
    selectedOptionIds: safeParseArray(a.selectedOptionIds),
    textAnswer: a.textAnswer,
    codeAnswer: a.codeAnswer,
  }));

  const result = scoreAttempt(scoringQuestions, studentAnswers, attempt.test.passingScore, attempt.test.negativeMarking);

  await prisma.$transaction([
    // Persist per-question outcomes (SHORT_ANSWER/CODING stay null → manual grading)
    ...result.questionResults
      .filter((r) => r.isCorrect !== null)
      .map((r) =>
        prisma.testAnswer.updateMany({
          where: { attemptId, questionId: r.questionId },
          data: { isCorrect: r.isCorrect, marksAwarded: r.marksAwarded },
        })
      ),
    prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        timeTakenSec: Math.max(0, Math.round((Date.now() - attempt.startedAt.getTime()) / 1000)),
        score: result.score,
        percentage: result.percentage,
        passed: result.passed,
      },
    }),
    prisma.studentProfile.update({
      where: { userId: attempt.studentId },
      data: {
        testsCompleted: { increment: 1 },
        ...(result.passed ? { testsPassed: { increment: 1 } } : {}),
      },
    }),
  ]);

  // Points come from validated backend events only.
  if (result.passed) {
    await awardPoints({
      studentId: attempt.studentId,
      points: 30,
      reason: "TEST_PASSED",
      description: "Test passed",
      testId: attempt.testId,
    });
  } else {
    await awardPoints({
      studentId: attempt.studentId,
      points: 10,
      reason: "TEST_COMPLETED",
      description: "Test completed",
      testId: attempt.testId,
    });
  }

  await touchStreak(attempt.studentId);
  await checkAchievements(attempt.studentId);

  return { score: result.score, maxScore: result.maxScore, percentage: result.percentage, passed: result.passed };
}

export function safeParseArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/**
 * Mentor manual grading for SHORT_ANSWER / CODING questions:
 * applies mentor marks then recomputes the attempt score from all stored answers.
 */
export async function applyManualGrades(
  attemptId: string,
  marks: { questionId: string; marksAwarded: number }[]
): Promise<{ ok: boolean; error?: string }> {
  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      test: { select: { passingScore: true, negativeMarking: true } },
      answers: true,
    },
  });
  if (!attempt) return { ok: false, error: "Attempt not found." };

  const questions = await prisma.testQuestion.findMany({
    where: { testId: attempt.testId },
    include: { options: true },
    orderBy: { order: "asc" },
  });
  const questionMap = new Map(questions.map((q) => [q.id, q]));
  const markMap = new Map(marks.map((m) => [m.questionId, m.marksAwarded]));

  // Apply manual marks (clamped to [0, question marks] for manual types only)
  for (const [questionId, value] of markMap) {
    const q = questionMap.get(questionId);
    if (!q) continue;
    if (q.type !== "SHORT_ANSWER" && q.type !== "CODING") continue; // auto-graded types are immutable
    const clamped = Math.max(0, Math.min(q.marks, Math.round(Number(value) || 0)));
    await prisma.testAnswer.updateMany({
      where: { attemptId, questionId },
      data: { isCorrect: clamped >= q.marks, marksAwarded: clamped },
    });
  }

  // Recompute totals from all stored answers
  const answers = await prisma.testAnswer.findMany({ where: { attemptId } });
  let score = 0;
  let maxScore = 0;
  for (const q of questions) {
    maxScore += q.marks;
    const a = answers.find((x) => x.questionId === q.id);
    if (a) score += a.marksAwarded;
  }
  const percentage = maxScore > 0 ? Math.round((Math.max(0, score) / maxScore) * 100) : 0;
  const passed = percentage >= attempt.test.passingScore;

  await prisma.testAttempt.update({
    where: { id: attemptId },
    data: { score: Math.max(0, score), percentage, passed },
  });

  return { ok: true };
}
