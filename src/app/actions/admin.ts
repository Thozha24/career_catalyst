"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { adminUpdateUserSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { limitOrThrow } from "@/lib/rate-limit";

export type AdminUserState = { error?: string; fieldErrors?: Record<string, string>; success?: string } | null;

/**
 * Admin-only: suspend/reactivate an account or change its role.
 * Admins cannot suspend or demote themselves — prevents the last-admin lockout.
 */
export async function adminUpdateUserAction(_prev: AdminUserState, formData: FormData): Promise<AdminUserState> {
  const admin = await requireAdmin();
  limitOrThrow(`admin-user:${admin.id}`, 60, 60 * 1000);

  const raw = Object.fromEntries(formData);
  const parsed = adminUpdateUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { userId, status, role } = parsed.data;

  if (userId === admin.id) {
    return { error: "You cannot change your own status or role — ask another admin." };
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, status: true } });
  if (!target) return { error: "User not found." };

  const data: { status?: "ACTIVE" | "SUSPENDED"; role?: "STUDENT" | "MENTOR" | "ADMIN" } = {};
  if (status) data.status = status;
  if (role) data.role = role;
  if (Object.keys(data).length === 0) return { error: "Nothing to update." };

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data }),
    // Suspension must kill active sessions immediately.
    ...(status === "SUSPENDED"
      ? [prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } })]
      : []),
  ]);

  await audit({
    actorId: admin.id,
    action: status === "SUSPENDED" ? "ACCOUNT_SUSPENDED" : status === "ACTIVE" ? "ACCOUNT_REACTIVATED" : "ROLE_CHANGED",
    resource: "user",
    resourceId: userId,
    metadata: data,
  });
  revalidatePath("/admin/users");
  return { success: "User updated." };
}
