import "server-only";
import { prisma } from "./prisma";

/**
 * In-app notification helpers. (Email dispatch is an optional integration —
 * see docs/deployment.md for wiring an SMTP/SaaS provider.)
 */

export type NotificationType =
  | "NEW_TEST"
  | "TEST_REMINDER"
  | "NEW_TASK"
  | "TASK_DEADLINE"
  | "TASK_FEEDBACK"
  | "GROUP_ANNOUNCEMENT"
  | "ACHIEVEMENT"
  | "POINTS"
  | "MENTOR_FEEDBACK"
  | "SYSTEM"
  | "GROUP_JOINED";

export async function notify(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}): Promise<void> {
  await prisma.notification
    .create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        link: params.link,
      },
    })
    .catch(() => undefined);
}

export async function notifyMany(userIds: string[], data: Omit<Parameters<typeof notify>[0], "userId">): Promise<void> {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return;
  await prisma.notification
    .createMany({
      data: unique.map((userId) => ({ userId, ...data })),
    })
    .catch(() => undefined);
}

export async function notifyGroupMembers(groupId: string, data: Omit<Parameters<typeof notify>[0], "userId">): Promise<void> {
  const members = await prisma.groupMember.findMany({
    where: { groupId, isActive: true },
    select: { studentId: true },
  });
  await notifyMany(members.map((m) => m.studentId), data);
}
