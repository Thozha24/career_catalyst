"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMentor, requireStudent, isGroupMentor, isGroupMember } from "@/lib/guards";
import { createTestSchema } from "@/lib/validation";
import { notify, notifyGroupMembers } from "@/lib/notifications";
import { audit } from "@/lib/audit";
import { limitOrThrow } from "@/lib/rate-limit";
import { applyManualGrades } from "@/lib/test-grading";

export type ApiResult = { ok: boolean; error?: string; id?: string };

// ─── Mentor: create test ─────────────────────────────────────────────────────

export async function createTestAction(payload: unknown): Promise<ApiResult> {
  const user = await requireMentor();
  limitOrThrow(`test-create:${user.id}`, 30, 60 * 60 * 1000);

  const parsed = createTestSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid test." };
  }
  const d = parsed.data;

  if (!(await isGroupMentor(user.id, d.groupId))) {
    return { ok: false, error: "You can only assign tests to your own groups." };
  }
  // Exactly one correct option for MCQ/TRUE_FALSE; ≥1 for others.
  for (const [i, q] of d.questions.entries()) {
    const correctCount = q.options.filter((o) => o.isCorrect).length;
    if ((q.type === "MCQ" || q.type === "TRUE_FALSE") && correctCount !== 1) {
      return { ok: false, error: `Question ${i + 1}: choose exactly one correct option.` };
    }
    if (q.type === "MULTI_SELECT" && correctCount < 2) {
      return { ok: false, error: `Question ${i + 1}: multi-select needs at least two correct options.` };
    }
    if (q.type === "SHORT_ANSWER" && correctCount < 1) {
      return { ok: false, error: `Question ${i + 1}: provide the expected short answer.` };
    }
    if (q.type !== "CODING" && q.options.length === 0) {
      return { ok: false, error: `Question ${i + 1}: add options.` };
    }
  }

  const test = await prisma.test.create({
    data: {
      title: d.title,
      description: d.description ?? null,
      durationMin: d.durationMin,
      groupId: d.groupId,
      createdBy: user.id,
      availableFrom: d.availableFrom ? new Date(d.availableFrom) : null,
      availableUntil: d.availableUntil ? new Date(d.availableUntil) : null,
      passingScore: d.passingScore,
      negativeMarking: d.negativeMarking,
      questions: {
        create: d.questions.map((q, idx) => ({
          type: q.type,
          prompt: q.prompt,
          marks: q.marks,
          negativeMarks: q.negativeMarks,
          explanation: q.explanation ?? null,
          order: idx,
          options: { create: q.options.map((o, oi) => ({ text: o.text, isCorrect: o.isCorrect, order: oi })) },
        })),
      },
    },
    select: { id: true, title: true },
  });

  await notifyGroupMembers(d.groupId, {
    type: "NEW_TEST",
    title: `New test: ${test.title}`,
    body: `${d.durationMin} minutes · passing score ${d.passingScore}%`,
    link: "/student/tests",
  });
  await audit({ actorId: user.id, action: "TEST_CREATED", resource: "test", resourceId: test.id, metadata: { groupId: d.groupId, questions: d.questions.length } });

  revalidatePath("/mentor/tests");
  return { ok: true, id: test.id };
}

// ─── Student: start / resume an attempt ──────────────────────────────────────

export async function startAttemptAction(testId: string): Promise<ApiResult> {
  const user = await requireStudent();
  limitOrThrow(`attempt-start:${user.id}`, 20, 60 * 60 * 1000);

  const test = await prisma.test.findUnique({
    where: { id: testId },
    select: { id: true, groupId: true, isActive: true, availableFrom: true, availableUntil: true },
  });
  if (!test || !test.isActive) return { ok: false, error: "Test not found." };
  if (!(await isGroupMember(user.id, test.groupId))) {
    return { ok: false, error: "This test belongs to a group you are not in." };
  }
  const now = new Date();
  if (test.availableFrom && now < test.availableFrom) return { ok: false, error: "This test is not open yet." };
  if (test.availableUntil && now > test.availableUntil) return { ok: false, error: "This test window has closed." };

  // Resume an in-progress attempt instead of creating a duplicate.
  const existing = await prisma.testAttempt.findFirst({
    where: { testId, studentId: user.id, status: "IN_PROGRESS" },
    select: { id: true, startedAt: true },
    orderBy: { startedAt: "desc" },
  });
  if (existing) return { ok: true, id: existing.id };

  const attempt = await prisma.testAttempt.create({
    data: { testId, studentId: user.id, attemptNo: 1, status: "IN_PROGRESS" },
    select: { id: true },
  });
  await audit({ actorId: user.id, action: "TEST_ATTEMPT_STARTED", resource: "test", resourceId: testId });
  return { ok: true, id: attempt.id };
}

// ─── Mentor: manual grading for short-answer / coding questions ──────────────

export async function gradeAttemptAction(
  attemptId: string,
  marks: { questionId: string; marksAwarded: number }[]
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireMentor();
  limitOrThrow(`test-grade:${user.id}`, 60, 60 * 60 * 1000);

  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    select: { id: true, testId: true, test: { select: { groupId: true, createdBy: true } } },
  });
  if (!attempt) return { ok: false, error: "Attempt not found." };
  const ownsGroup = await isGroupMentor(user.id, attempt.test.groupId);
  if (!ownsGroup && attempt.test.createdBy !== user.id) {
    return { ok: false, error: "You can only grade attempts for your own tests." };
  }

  const result = await applyManualGrades(attemptId, marks);
  if (result.ok) {
    await audit({ actorId: user.id, action: "TEST_MANUALLY_GRADED", resource: "test_attempt", resourceId: attemptId });
    revalidatePath(`/mentor/tests/${attempt.testId}`);
  }
  return result;
}
