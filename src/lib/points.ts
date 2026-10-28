import "server-only";
import { prisma } from "./prisma";

/**
 * Points & gamification — ALL point mutations flow through here, on the
 * backend, triggered by validated events. Client-sent point values are never
 * trusted (business rule: students cannot modify their own points).
 */

export type PointReason =
  | "LESSON_COMPLETED"
  | "CODING_SOLVED"
  | "TEST_PASSED"
  | "TEST_COMPLETED"
  | "TASK_COMPLETED"
  | "STREAK_BONUS"
  | "ACHIEVEMENT_BONUS"
  | "MENTOR_AWARD";

const WEEK_MS = 7 * 24 * 3600 * 1000;
const MONTH_MS = 30 * 24 * 3600 * 1000;

/**
 * Award points to a student inside a transaction: writes an immutable ledger
 * entry and updates the denormalized profile aggregates (total/weekly/monthly).
 */
export async function awardPoints(params: {
  studentId: string;
  points: number;
  reason: PointReason;
  description?: string;
  lessonId?: string;
  problemId?: string;
  testId?: string;
  taskId?: string;
}): Promise<{ totalPoints: number; awarded: number }> {
  const points = Math.trunc(params.points);
  if (!Number.isFinite(points) || points <= 0) {
    throw new Error("Points to award must be a positive integer.");
  }
  if (points > 1000) {
    throw new Error("Refusing to award an unreasonable number of points in one event.");
  }

  return prisma.$transaction(async (tx) => {
    await tx.pointsTransaction.create({
      data: {
        studentId: params.studentId,
        points,
        reason: params.reason,
        description: params.description,
        lessonId: params.lessonId,
        problemId: params.problemId,
        testId: params.testId,
        taskId: params.taskId,
      },
    });

    const profile = await tx.studentProfile.update({
      where: { userId: params.studentId },
      data: {
        totalPoints: { increment: points },
        weeklyPoints: { increment: points },
        monthlyPoints: { increment: points },
      },
    });

    return { totalPoints: profile.totalPoints, awarded: points };
  });
}

/**
 * Decay weekly/monthly windows lazily: if the last ledger entry is older than
 * the window, reset the rolling counters. Called before reads that care.
 */
export async function refreshPointsWindows(studentId: string): Promise<void> {
  const last = await prisma.pointsTransaction.findFirst({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  const cutoffWeek = new Date(Date.now() - WEEK_MS);
  const cutoffMonth = new Date(Date.now() - MONTH_MS);

  const data: { weeklyPoints?: number; monthlyPoints?: number } = {};
  if (!last || last.createdAt < cutoffWeek) data.weeklyPoints = 0;
  if (!last || last.createdAt < cutoffMonth) data.monthlyPoints = 0;
  if (Object.keys(data).length === 0) return;

  await prisma.studentProfile.update({ where: { userId: studentId }, data }).catch(() => undefined);
}

/**
 * Update the daily learning streak. Returns true if the user is "active today"
 * (i.e. this call registered today's activity).
 */
export async function touchStreak(studentId: string): Promise<boolean> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: studentId },
    select: { lastActivityDate: true, currentStreak: true, longestStreak: true },
  });
  if (!profile) return false;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last = profile.lastActivityDate
    ? new Date(
        profile.lastActivityDate.getFullYear(),
        profile.lastActivityDate.getMonth(),
        profile.lastActivityDate.getDate()
      )
    : null;

  if (last && last.getTime() === today.getTime()) return false; // already active today

  const yesterday = new Date(today.getTime() - 24 * 3600 * 1000);
  const isConsecutive = last && last.getTime() === yesterday.getTime();

  const currentStreak = isConsecutive ? profile.currentStreak + 1 : 1;
  const longestStreak = Math.max(currentStreak, profile.longestStreak);

  await prisma.studentProfile.update({
    where: { userId: studentId },
    data: { currentStreak, longestStreak, lastActivityDate: now },
  });
  return true;
}
