import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/guards";
import { autosaveAnswerSchema } from "@/lib/validation";
import { limitOrThrow } from "@/lib/rate-limit";
import { ok, fail, handle, readJson } from "@/lib/api";

/**
 * Autosave one answer for an IN_PROGRESS attempt that belongs to the caller.
 * Attempts are deadline-enforced: past the grace window the attempt is
 * auto-submitted (graded from what was saved) so no work is silently lost.
 */
const GRACE_MS = 5 * 60 * 1000;

export async function POST(req: Request) {
  return handle(async () => {
    const user = await getApiUser();
    if (!user) return fail("You must be signed in.", 401, "UNAUTHORIZED");
    limitOrThrow(`autosave:${user.id}`, 240, 60 * 1000);

    const body = autosaveAnswerSchema.safeParse(await readJson(req));
    if (!body.success) return fail("Invalid request.", 422, "VALIDATION_ERROR");
    const d = body.data;

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: d.attemptId },
      select: { id: true, studentId: true, status: true, startedAt: true, test: { select: { durationMin: true } } },
    });
    if (!attempt || attempt.studentId !== user.id) {
      return fail("Attempt not found.", 404, "NOT_FOUND");
    }
    if (attempt.status !== "IN_PROGRESS") {
      return fail("This attempt has already been submitted.", 409, "ATTEMPT_CLOSED");
    }
    const deadline = attempt.startedAt.getTime() + attempt.test.durationMin * 60 * 1000;
    const expired = Date.now() > deadline + GRACE_MS;
    if (expired) {
      // Auto-submit from the server so saved answers are graded, not lost.
      const { gradeAndStoreAttempt } = await import("@/lib/test-grading");
      await gradeAndStoreAttempt(attempt.id);
      return fail("Time is up — your test was submitted automatically.", 409, "ATTEMPT_CLOSED");
    }

    // The question must belong to the attempt's test (prevents cross-test injection).
    const attemptQuestions = await prisma.testQuestion.findMany({
      where: { test: { attempts: { some: { id: d.attemptId } } } },
      select: { id: true },
    });
    if (!attemptQuestions.some((q) => q.id === d.questionId)) {
      return fail("Invalid question for this attempt.", 403, "FORBIDDEN");
    }

    await prisma.testAnswer.upsert({
      where: { attemptId_questionId: { attemptId: d.attemptId, questionId: d.questionId } },
      create: {
        attemptId: d.attemptId,
        questionId: d.questionId,
        studentId: user.id,
        selectedOptionIds: JSON.stringify(d.selectedOptionIds ?? []),
        textAnswer: d.textAnswer ?? null,
        codeAnswer: d.codeAnswer ?? null,
      },
      update: {
        selectedOptionIds: JSON.stringify(d.selectedOptionIds ?? []),
        textAnswer: d.textAnswer ?? null,
        codeAnswer: d.codeAnswer ?? null,
      },
    });
    return ok({ saved: true });
  });
}
