import { prisma } from "@/lib/prisma";
import { getApiRoleUser } from "@/lib/guards";
import { runCodeSchema } from "@/lib/validation";
import { evaluateSubmission } from "@/lib/code-runner";
import { limitOrThrow } from "@/lib/rate-limit";
import { ok, fail, handle, readJson, clientIp } from "@/lib/api";
import { safeParseArray } from "@/lib/test-grading";

/**
 * Run code against the PUBLIC test cases only (hidden tests are withheld so
 * they cannot be probed). Nothing is persisted; no points are awarded.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await getApiRoleUser("STUDENT", "MENTOR", "ADMIN");
    if (!user) return fail("You must be signed in.", 401, "UNAUTHORIZED");
    limitOrThrow(`code-run:${user.id}:${clientIp(req)}`, 30, 60 * 1000);

    const body = runCodeSchema.safeParse(await readJson(req));
    if (!body.success) return fail("Invalid request.", 422, "VALIDATION_ERROR");

    const problem = await prisma.codingProblem.findUnique({
      where: { id: body.data.problemId },
      select: { testCases: true },
    });
    if (!problem) return fail("Problem not found.", 404, "NOT_FOUND");

    const allCases = safeParseArray(problem.testCases) as unknown as { input: string; expectedOutput: string; hidden?: boolean }[];
    const publicCases = allCases.filter((tc) => !tc.hidden);

    const result = await evaluateSubmission({
      language: body.data.language,
      code: body.data.code,
      testCases: publicCases,
    });
    return ok(result);
  });
}
