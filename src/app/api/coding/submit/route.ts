import { prisma } from "@/lib/prisma";
import { getApiRoleUser } from "@/lib/guards";
import { submitCodeSchema } from "@/lib/validation";
import { evaluateSubmission } from "@/lib/code-runner";
import { limitOrThrow } from "@/lib/rate-limit";
import { awardPoints, touchStreak } from "@/lib/points";
import { checkAchievements } from "@/lib/achievements";
import { ok, fail, handle, readJson, clientIp } from "@/lib/api";
import { safeParseArray } from "@/lib/test-grading";

export type SubmitCodeResponse = {
  verdict: string;
  passedCount: number;
  totalCount: number;
  runtimeMs: number;
  pointsAwarded: number;
  achievements: string[];
  outputs: { passed: boolean; hidden: boolean }[];
};

/**
 * Submit a solution. Runs against ALL test cases (hidden included) but the
 * response only reveals pass/fail per case — never hidden inputs or outputs.
 * Points are awarded once, on the first ACCEPTED submission, server-side.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await getApiRoleUser("STUDENT", "MENTOR", "ADMIN");
    if (!user) return fail("You must be signed in.", 401, "UNAUTHORIZED");
    limitOrThrow(`code-submit:${user.id}:${clientIp(req)}`, 20, 60 * 1000);

    const body = submitCodeSchema.safeParse(await readJson(req));
    if (!body.success) return fail("Invalid request.", 422, "VALIDATION_ERROR");
    const { problemId, language, code } = body.data;

    const problem = await prisma.codingProblem.findUnique({
      where: { id: problemId },
      select: { id: true, pointsAward: true, testCases: true },
    });
    if (!problem) return fail("Problem not found.", 404, "NOT_FOUND");

    const testCases = safeParseArray(problem.testCases) as unknown as { input: string; expectedOutput: string; hidden?: boolean }[];
    const result = await evaluateSubmission({ language, code, testCases });

    const alreadySolved =
      user.role === "STUDENT" &&
      (await prisma.codingSubmission.findFirst({
        where: { userId: user.id, problemId, verdict: "ACCEPTED" },
        select: { id: true },
      }));

    let pointsAwarded = 0;
    let achievements: string[] = [];

    await prisma.codingSubmission.create({
      data: {
        userId: user.id,
        problemId,
        language,
        code: code.slice(0, 20000),
        verdict: result.verdict,
        passedCount: result.passedCount,
        totalCount: result.totalCount,
        runtimeMs: result.runtimeMs,
        pointsAwarded: 0,
      },
    });

    if (user.role === "STUDENT" && result.verdict === "ACCEPTED" && !alreadySolved) {
      const award = await awardPoints({
        studentId: user.id,
        points: problem.pointsAward,
        reason: "CODING_SOLVED",
        description: `Solved: ${problemId}`,
        problemId,
      }).catch(() => ({ awarded: 0 }));
      pointsAwarded = award.awarded;
      await prisma.studentProfile.update({
        where: { userId: user.id },
        data: { codingSolved: { increment: 1 } },
      });
      await prisma.codingSubmission.updateMany({
        where: { userId: user.id, problemId, verdict: result.verdict },
        data: { pointsAwarded },
      });
      await touchStreak(user.id);
      achievements = await checkAchievements(user.id);
    }

    const response: SubmitCodeResponse = {
      verdict: result.verdict,
      passedCount: result.passedCount,
      totalCount: result.totalCount,
      runtimeMs: result.runtimeMs,
      pointsAwarded,
      achievements,
      outputs: result.outputs.map((o) => ({ passed: o.passed, hidden: o.hidden })),
    };
    return ok(response);
  });
}
