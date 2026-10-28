import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/guards";
import { limitOrThrow } from "@/lib/rate-limit";
import { ok, fail, handle, readJson } from "@/lib/api";

/** Mark notifications read: POST { id } for one, POST { all: true } for all. */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await getApiUser();
    if (!user) return fail("You must be signed in.", 401, "UNAUTHORIZED");
    limitOrThrow(`notif-read:${user.id}`, 60, 60 * 1000);

    const body = (await readJson(req)) as { id?: string; all?: boolean };

    if (body.all) {
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
      return ok({ updated: "all" });
    }
    if (body.id) {
      await prisma.notification.updateMany({
        where: { id: body.id, userId: user.id }, // ownership enforced
        data: { isRead: true, readAt: new Date() },
      });
      return ok({ updated: body.id });
    }
    return fail("Provide an id or all=true.", 422, "VALIDATION_ERROR");
  });
}
