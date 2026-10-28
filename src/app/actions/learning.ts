"use server";

import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/guards";
import { awardPoints, touchStreak } from "@/lib/points";
import { checkAchievements } from "@/lib/achievements";
import { lessonCompleteSchema, quizSubmitSchema } from "@/lib/validation";
import { limitOrThrow } from "@/lib/rate-limit";

export type CompleteLessonResult = {
  ok: boolean;
  error?: string;
  pointsAwarded?: number;
  achievements?: string[];
};

/**
 * Mark a lesson complete. Points are awarded exactly once per lesson (DB
 * unique constraint on [userId, lessonId]) — the client can never inflate
 * progress or points by replaying this action.
 */
export async function completeLessonAction(lessonId: string): Promise<CompleteLessonResult> {
  const user = await requireStudent();
  limitOrThrow(`lesson:${user.id}`, 60, 60 * 1000);

  const parsed = lessonCompleteSchema.safeParse({ lessonId });
  if (!parsed.success) return { ok: false, error: "Invalid lesson." };

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, pointsAward: true },
  });
  if (!lesson) return { ok: false, error: "Lesson not found." };

  const existing = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    select: { id: true },
  });
  if (existing) return { ok: true, pointsAwarded: 0 };

  let pointsAwarded = 0;
  try {
    await prisma.lessonProgress.create({ data: { userId: user.id, lessonId } });
    const result = await awardPoints({
      studentId: user.id,
      points: lesson.pointsAward,
      reason: "LESSON_COMPLETED",
      description: "Lesson completed",
      lessonId,
    });
    pointsAwarded = result.awarded;
  } catch {
    // Lost a race — progress already recorded by a concurrent request.
    return { ok: true, pointsAwarded: 0 };
  }

  await touchStreak(user.id);
  const achievements = await checkAchievements(user.id);
  return { ok: true, pointsAwarded, achievements };
}

export type QuizGradeResult = {
  ok: boolean;
  error?: string;
  results: boolean[];
  passed: boolean;
  correctIndices: number[];
};

/**
 * Grade a lesson quiz ON THE SERVER against the stored answer key.
 * The client never receives the key beforehand and cannot grade itself.
 */
export async function submitQuizAction(lessonId: string, answers: number[]): Promise<QuizGradeResult> {
  const user = await requireStudent();
  limitOrThrow(`quiz:${user.id}`, 30, 60 * 1000);

  const parsed = quizSubmitSchema.safeParse({ lessonId, answers });
  if (!parsed.success) return { ok: false, error: "Invalid quiz submission.", results: [], passed: false, correctIndices: [] };

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { quiz: true } });
  if (!lesson) return { ok: false, error: "Lesson not found.", results: [], passed: false, correctIndices: [] };

  let quiz: { question: string; options: string[]; answerIndex: number }[] = [];
  try {
    quiz = JSON.parse(lesson.quiz);
  } catch {
    quiz = [];
  }
  if (!Array.isArray(quiz) || quiz.length === 0) {
    return { ok: true, results: [], passed: true, correctIndices: [] };
  }

  const results = quiz.map((q, i) => answers[i] === q.answerIndex);
  const correctIndices = quiz.map((q) => q.answerIndex);
  const passed = results.every(Boolean);
  return { ok: true, results, passed, correctIndices };
}
