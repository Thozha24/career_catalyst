import { redirect } from "next/navigation";
import { getSessionUser, type AuthUser } from "./auth";
import { prisma } from "./prisma";
import type { NextResponse } from "next/server";

export type Role = "STUDENT" | "MENTOR" | "ADMIN";

/**
 * Authorization guards — every protected server page and API route goes
 * through these. Frontend route protection is a UX nicety; these are the
 * actual enforcement points (defense in depth).
 */

export async function requireUser(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) redirect("/signin");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<AuthUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect(defaultHomeFor(user.role));
  return user;
}

export async function requireStudent(): Promise<AuthUser> {
  return requireRole("STUDENT");
}

export async function requireMentor(): Promise<AuthUser> {
  return requireRole("MENTOR");
}

export async function requireAdmin(): Promise<AuthUser> {
  return requireRole("ADMIN");
}

export function defaultHomeFor(role: Role | string): string {
  switch (role) {
    case "MENTOR":
      return "/mentor/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    case "STUDENT":
    default:
      return "/student/dashboard";
  }
}

// ─── API-route variants (return null instead of redirecting) ─────────────────

export async function getApiUser(): Promise<AuthUser | null> {
  return getSessionUser();
}

export async function getApiRoleUser(...roles: Role[]): Promise<AuthUser | null> {
  const user = await getSessionUser();
  if (!user || !roles.includes(user.role)) return null;
  return user;
}

// ─── Group authorization: mentors may only touch groups they own ─────────────

export async function isGroupMentor(userId: string, groupId: string): Promise<boolean> {
  const group = await prisma.group.findUnique({ where: { id: groupId }, select: { mentorId: true } });
  return group?.mentorId === userId;
}

export async function isGroupMember(userId: string, groupId: string): Promise<boolean> {
  const m = await prisma.groupMember.findUnique({
    where: { groupId_studentId: { groupId, studentId: userId } },
  });
  return !!m?.isActive;
}

/** Mentor of the group OR admin OR member of the group. */
export async function canAccessGroup(user: AuthUser, groupId: string): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  if (user.role === "MENTOR") return isGroupMentor(user.id, groupId);
  return isGroupMember(user.id, groupId);
}

/** Can this mentor view/manage this student? (via shared group membership) */
export async function mentorCanAccessStudent(mentorId: string, studentId: string): Promise<boolean> {
  const shared = await prisma.groupMember.findFirst({
    where: { studentId, group: { mentorId, isActive: true }, isActive: true },
    select: { id: true },
  });
  return !!shared;
}

// ─── API guard helpers that return typed results ─────────────────────────────

export type Guard<T> = { user: T } | { response: NextResponse };

export async function apiUserGuard(): Promise<Guard<AuthUser>> {
  const user = await getSessionUser();
  if (!user) {
    const { unauthorized } = await import("./api");
    return { response: unauthorized() };
  }
  return { user };
}

export async function apiRoleGuard(...roles: Role[]): Promise<Guard<AuthUser>> {
  const user = await getSessionUser();
  if (!user) {
    const { unauthorized } = await import("./api");
    return { response: unauthorized() };
  }
  if (!roles.includes(user.role)) {
    const { forbidden } = await import("./api");
    return { response: forbidden() };
  }
  return { user };
}
