import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/guards";
import { submitTestSchema } from "@/lib/validation";
import { limitOrThrow } from "@/lib/rate-limit";
import { ok, fail, handle, readJson } from "@/lib/api";
import { gradeAndStoreAttempt } from "@/lib/test-grading";

/** Submit an attempt: validates ownership, stores final answers, grades server-side. */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await getApiUser();
    if (!user) return fail("You must be signed in.", 401, "UNAUTHORIZED");
    limitOrThrow(`test-submit:${user.id}`, 10, 60 * 1000);

    const body = submitTestSchema.safeParse(await readJson(req));
    if (!body.success) return fail("Invalid request.", 422, "VALIDATION_ERROR");
    const { attemptId, answers } = body.data;

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true, studentId: true, status: true, startedAt: true,
        test: { select: { id: true, durationMin: true } },
      },
    });
    if (!attempt || attempt.studentId !== user.id) {
      return fail("Attempt not found.", 404, "NOT_FOUND");
    }
    if (attempt.status !== "IN_PROGRESS") {
      return fail("This attempt has already been submitted.", 409, "ATTEMPT_CLOSED");
    }

    // Persist every submitted answer (upsert keyed on attempt+question).
    const questionIds = new Set(
      (
        await prisma.testQuestion.findMany({
          where: { testId: attempt.test.id },
          select: { id: true },
        })
      ).map((q) => q.id)
    );
    for (const a of answers) {
      if (!questionIds.has(a.questionId)) continue; // ignore foreign question ids
      await prisma.testAnswer.upsert({
        where: { attemptId_questionId: { attemptId, questionId: a.questionId } },
        create: {
          attemptId,
          questionId: a.questionId,
          studentId: user.id,
          selectedOptionIds: JSON.stringify(a.selectedOptionIds ?? []),
          textAnswer: a.textAnswer ?? null,
          codeAnswer: a.codeAnswer ?? null,
        },
        update: {
          selectedOptionIds: JSON.stringify(a.selectedOptionIds ?? []),
          textAnswer: a.textAnswer ?? null,
          codeAnswer: a.codeAnswer ?? null,
        },
      });
    }

    // Grace: allow submits up to 5 minutes past the deadline (server clock).
    const deadline = attempt.startedAt.getTime() + attempt.test.durationMin * 60 * 1000;
    if (Date.now() > deadline + 5 * 60 * 1000) {
      await gradeAndStoreAttempt(attemptId);
      return fail("Time is up — your test was already submitted automatically.", 409, "ATTEMPT_CLOSED");
    }

    const result = await gradeAndStoreAttempt(attemptId);
    if (!result) return fail("Attempt not found.", 404, "NOT_FOUND");

    return ok({
      score: result.score,
      maxScore: result.maxScore,
      percentage: result.percentage,
      passed: result.passed,
    });
  });
}
