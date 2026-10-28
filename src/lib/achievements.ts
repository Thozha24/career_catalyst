import "server-only";
import { prisma } from "./prisma";
import { awardPoints } from "./points";
import { notify } from "./notifications";

/**
 * Achievement engine — evaluated ONLY on the backend after validated events
 * (lesson completed, problem solved, test submitted, task reviewed, streaks).
 * Badges are stored once (unique constraint) and may carry a points bonus.
 */

export async function checkAchievements(studentId: string): Promise<string[]> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: studentId },
    select: {
      totalPoints: true,
      currentStreak: true,
      codingSolved: true,
      testsCompleted: true,
      tasksCompleted: true,
    },
  });
  if (!profile) return [];

  const [earned, catalog, lessonCount, hasPerfectScore] = await Promise.all([
    prisma.studentAchievement.findMany({ where: { studentId }, select: { achievementId: true } }),
    prisma.achievement.findMany(),
    prisma.lessonProgress.count({ where: { userId: studentId } }),
    prisma.testAttempt.findFirst({
      where: { studentId, status: "SUBMITTED", percentage: { gte: 100 } },
      select: { id: true },
    }),
  ]);

  const earnedIds = new Set(earned.map((e) => e.achievementId));

  const qualifies = (code: string, points: number): boolean => {
    switch (code) {
      case "FIRST_LESSON": return lessonCount >= 1;
      case "FIVE_LESSONS": return lessonCount >= 5;
      case "FIRST_PROBLEM": return profile.codingSolved >= 1;
      case "FIVE_PROBLEMS": return profile.codingSolved >= 5;
      case "FIRST_TEST": return profile.testsCompleted >= 1;
      case "PERFECT_SCORE": return !!hasPerfectScore;
      case "STREAK_7": return profile.currentStreak >= 7;
      case "TASK_MASTER": return profile.tasksCompleted >= 5;
      case "POINTS_500": return points >= 500;
      case "POINTS_1000": return points >= 1000;
      default: return false;
    }
  };

  const unlock = async (achievementIds: string[]): Promise<void> => {
    if (achievementIds.length === 0) return;
    await prisma.studentAchievement
      .createMany({ data: achievementIds.map((achievementId) => ({ studentId, achievementId })) })
      .catch(() => undefined);
  };

  // Pass 1 — evaluate against current totals
  const firstPass = catalog.filter((a) => !earnedIds.has(a.id) && qualifies(a.code, profile.totalPoints));
  if (firstPass.length === 0) return [];
  await unlock(firstPass.map((a) => a.id));

  for (const a of firstPass) {
    if (a.pointsBonus > 0) {
      await awardPoints({
        studentId,
        points: a.pointsBonus,
        reason: "ACHIEVEMENT_BONUS",
        description: `Achievement unlocked: ${a.name}`,
      }).catch(() => undefined);
    }
    await notify({
      userId: studentId,
      type: "ACHIEVEMENT",
      title: `Achievement unlocked: ${a.name} 🏆`,
      body: a.description,
      link: "/student/achievements",
    });
  }

  // Pass 2 — bonuses may have crossed a points threshold; re-check once (no recursion)
  const bonusTotal = firstPass.reduce((sum, a) => sum + a.pointsBonus, 0);
  const secondPass = bonusTotal
    ? catalog.filter(
        (a) =>
          !firstPass.includes(a) &&
          !earnedIds.has(a.id) &&
          (a.code === "POINTS_500" || a.code === "POINTS_1000") &&
          qualifies(a.code, profile.totalPoints + bonusTotal)
      )
    : [];
  if (secondPass.length > 0) {
    await unlock(secondPass.map((a) => a.id));
    for (const a of secondPass) {
      await notify({
        userId: studentId,
        type: "ACHIEVEMENT",
        title: `Achievement unlocked: ${a.name} 🏆`,
        body: a.description,
        link: "/student/achievements",
      });
    }
  }

  return [...firstPass, ...secondPass].map((a) => a.name);
}
