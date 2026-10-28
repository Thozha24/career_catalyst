"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireMentor, isGroupMentor } from "@/lib/guards";
import { createGroupSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { limitOrThrow } from "@/lib/rate-limit";

export type ActionState = { error?: string; fieldErrors?: Record<string, string>; success?: string } | null;

function flattenZod(err: { issues: { path: (string | number)[]; message: string }[] }): { error: string; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { error: "Please fix the highlighted fields.", fieldErrors };
}

/** Create a mentor group. Invite code is generated server-side. */
export async function createGroupAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireMentor();
  limitOrThrow(`group-create:${user.id}`, 10, 60 * 60 * 1000);

  const parsed = createGroupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return flattenZod(parsed.error);

  const group = await prisma.group.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      mentorId: user.id,
      inviteCode: `cc-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`,
    },
    select: { id: true },
  });

  const h = await headers();
  await audit({
    actorId: user.id,
    action: "GROUP_CREATED",
    resource: "group",
    resourceId: group.id,
    metadata: { name: parsed.data.name },
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim(),
  });

  revalidatePath("/mentor/groups");
  return { success: group.id };
}

/** Rotate a group's invite code (mentor owns the group; admins too). */
export async function regenerateInviteCodeAction(groupId: string): Promise<{ ok: boolean; code?: string; error?: string }> {
  const user = await requireMentor();
  const owner = await isGroupMentor(user.id, groupId);
  if (!owner) return { ok: false, error: "You can only manage your own groups." };

  const code = `cc-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
  await prisma.group.update({ where: { id: groupId }, data: { inviteCode: code } });
  await audit({ actorId: user.id, action: "INVITE_CODE_ROTATED", resource: "group", resourceId: groupId });
  revalidatePath(`/mentor/groups/${groupId}`);
  return { ok: true, code };
}
