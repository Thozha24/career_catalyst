"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMentor, isGroupMentor } from "@/lib/guards";
import { announcementSchema } from "@/lib/validation";
import { notifyGroupMembers } from "@/lib/notifications";
import { audit } from "@/lib/audit";
import { limitOrThrow } from "@/lib/rate-limit";

export type AnnouncementState = { error?: string; fieldErrors?: Record<string, string>; success?: string } | null;

export async function createAnnouncementAction(_prev: AnnouncementState, formData: FormData): Promise<AnnouncementState> {
  const user = await requireMentor();
  limitOrThrow(`announcement:${user.id}`, 30, 60 * 60 * 1000);

  const parsed = announcementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }
  const { groupId, title, body } = parsed.data;

  if (!(await isGroupMentor(user.id, groupId))) {
    return { error: "You can only post announcements to your own groups." };
  }

  await prisma.announcement.create({ data: { groupId, authorId: user.id, title, body } });
  await notifyGroupMembers(groupId, {
    type: "GROUP_ANNOUNCEMENT",
    title: `📢 ${title}`,
    body: body.slice(0, 140),
    link: "/student/group",
  });
  await audit({ actorId: user.id, action: "ANNOUNCEMENT_POSTED", resource: "group", resourceId: groupId });

  revalidatePath("/mentor/announcements");
  revalidatePath(`/mentor/groups/${groupId}`);
  revalidatePath("/student/group");
  return { success: "Announcement posted." };
}
