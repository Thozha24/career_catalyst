"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  studentRegisterSchema,
  mentorRegisterSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  studentProfileSchema,
  mentorProfileSchema,
  joinGroupSchema,
} from "@/lib/validation";
import { hashPassword, verifyPassword, createSession, destroySession, generateOpaqueToken, hashToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, limitOrThrow, checkLoginLock, recordLoginFailure, recordLoginSuccess } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";
import { defaultHomeFor } from "@/lib/guards";

export type ActionState = { error?: string; fieldErrors?: Record<string, string>; success?: string } | null;

function flattenZod(err: { issues: { path: (string | number)[]; message: string }[] }): { error: string; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { error: "Please fix the highlighted fields.", fieldErrors };
}

async function requestMeta() {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
    userAgent: h.get("user-agent") ?? undefined,
  };
}

// ─── Registration ────────────────────────────────────────────────────────────

export async function registerStudent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const meta = await requestMeta();
  limitOrThrow(`register:${meta.ip}`, 10, 60 * 60 * 1000);

  const parsed = studentRegisterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return flattenZod(parsed.error);
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
  if (existing) {
    return { error: "An account with this email already exists. Try signing in instead.", fieldErrors: { email: "Email already registered." } };
  }

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      role: "STUDENT",
      status: "ACTIVE",
      emailVerified: true, // email delivery optional in this build; see docs
      avatarUrl: data.avatarUrl ?? null,
      studentProfile: {
        create: {
          phone: data.phone ?? null,
          college: data.college ?? null,
          course: data.course ?? null,
          graduationYear: data.graduationYear ?? null,
          skills: data.skills ?? "",
          interests: data.interests ?? "",
        },
      },
    },
    select: { id: true },
  });

  await audit({ actorId: user.id, action: "USER_REGISTERED", resource: "user", resourceId: user.id, metadata: { role: "STUDENT" }, ip: meta.ip, userAgent: meta.userAgent });
  await createSession(user.id, "STUDENT", data.email, meta);
  redirect("/student/dashboard");
}

export async function registerMentor(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const meta = await requestMeta();
  limitOrThrow(`register:${meta.ip}`, 10, 60 * 60 * 1000);

  const parsed = mentorRegisterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return flattenZod(parsed.error);
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
  if (existing) {
    return { error: "An account with this email already exists. Try signing in instead.", fieldErrors: { email: "Email already registered." } };
  }

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      role: "MENTOR",
      status: "ACTIVE",
      emailVerified: true,
      avatarUrl: data.avatarUrl ?? null,
      mentorProfile: {
        create: {
          phone: data.phone ?? null,
          title: data.title ?? null,
          organization: data.organization ?? null,
          yearsExperience: data.yearsExperience ?? null,
          expertise: data.expertise ?? "",
          skills: data.skills ?? "",
          bio: data.bio ?? null,
        },
      },
    },
    select: { id: true },
  });

  await audit({ actorId: user.id, action: "USER_REGISTERED", resource: "user", resourceId: user.id, metadata: { role: "MENTOR" }, ip: meta.ip, userAgent: meta.userAgent });
  await createSession(user.id, "MENTOR", data.email, meta);
  redirect("/mentor/dashboard");
}

// ─── Login / logout ──────────────────────────────────────────────────────────

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const meta = await requestMeta();
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return flattenZod(parsed.error);
  const { email, password } = parsed.data;

  // Brute-force protection: per-email and per-IP lockout
  const emailKey = `login:email:${email}`;
  const ipKey = `login:ip:${meta.ip}`;
  for (const key of [emailKey, ipKey]) {
    const lock = checkLoginLock(key);
    if (lock.locked) {
      return { error: `Too many failed attempts. Try again in ${Math.ceil(lock.retryAfterSec / 60)} minute(s).` };
    }
  }
  limitOrThrow(ipKey, 30, 10 * 60 * 1000);

  const user = await prisma.user.findUnique({ where: { email } });
  const INVALID = { error: "Invalid email or password." };

  if (!user || user.deletedAt) {
    recordLoginFailure(emailKey);
    recordLoginFailure(ipKey);
    return INVALID;
  }
  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
    recordLoginFailure(emailKey);
    recordLoginFailure(ipKey);
    await audit({ actorId: user.id, action: "LOGIN_FAILED", resource: "user", resourceId: user.id, ip: meta.ip });
    return INVALID;
  }
  if (user.status === "SUSPENDED") {
    return { error: "This account has been suspended. Contact support for help." };
  }

  recordLoginSuccess(emailKey);
  recordLoginSuccess(ipKey);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await audit({ actorId: user.id, action: "LOGIN", resource: "user", resourceId: user.id, ip: meta.ip, userAgent: meta.userAgent });
  await createSession(user.id, user.role, user.email, meta);

  redirect(defaultHomeFor(user.role));
}

export async function signOut(): Promise<void> {
  const meta = await requestMeta();
  await audit({ action: "LOGOUT", ip: meta.ip });
  await destroySession();
  redirect("/signin");
}

// ─── Password reset ──────────────────────────────────────────────────────────

export async function requestPasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const meta = await requestMeta();
  limitOrThrow(`forgot:${meta.ip}`, 5, 60 * 60 * 1000);

  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return flattenZod(parsed.error);

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  // Always report success — never reveal whether an email exists
  if (user) {
    const { raw, hash } = generateOpaqueToken();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    await audit({ actorId: user.id, action: "PASSWORD_RESET_REQUESTED", resource: "user", resourceId: user.id, ip: meta.ip });
    // Email delivery is an optional integration (see docs/deployment.md).
    // In development the reset link is printed to the server console:
    if (process.env.NODE_ENV !== "production") {
      console.log(`[dev] Password reset link: /reset-password?token=${raw}`);
    }
  }
  return { success: "If an account exists for that email, a reset link has been sent." };
}

export async function resetPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const meta = await requestMeta();
  limitOrThrow(`reset:${meta.ip}`, 10, 60 * 60 * 1000);

  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return flattenZod(parsed.error);
  const { token, password } = parsed.data;

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, status: true } } },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Invalidate all existing sessions after a password reset
    prisma.session.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
  await audit({ actorId: record.userId, action: "PASSWORD_RESET_COMPLETED", resource: "user", resourceId: record.userId, ip: meta.ip });

  redirect("/signin?reset=1");
}

export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const meta = await requestMeta();
  const { getSessionUser } = await import("@/lib/auth");
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };

  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return flattenZod(parsed.error);

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!dbUser || !(await verifyPassword(parsed.data.currentPassword, dbUser.passwordHash))) {
    return { error: "Your current password is incorrect.", fieldErrors: { currentPassword: "Incorrect password." } };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.session.updateMany({ where: { userId: user.id, revokedAt: null, id: { not: user.sessionId } }, data: { revokedAt: new Date() } }),
  ]);
  await audit({ actorId: user.id, action: "PASSWORD_CHANGED", resource: "user", resourceId: user.id, ip: meta.ip });
  return { success: "Password updated. Other sessions were signed out." };
}

// ─── Profile updates ─────────────────────────────────────────────────────────

export async function updateStudentProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { getSessionUser } = await import("@/lib/auth");
  const user = await getSessionUser();
  if (!user || user.role !== "STUDENT") return { error: "You must be signed in as a student." };

  const parsed = studentProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return flattenZod(parsed.error);
  const d = parsed.data;

  // Validate projects/certifications JSON if provided
  const safeJson = (raw: string | undefined, fallback: string) => {
    if (!raw || raw.trim() === "") return fallback;
    try {
      const parsedJson = JSON.parse(raw);
      return JSON.stringify(parsedJson);
    } catch {
      return fallback;
    }
  };

  await prisma.user.update({ where: { id: user.id }, data: { fullName: d.fullName, avatarUrl: d.avatarUrl ?? null } });
  await prisma.studentProfile.update({
    where: { userId: user.id },
    data: {
      bio: d.bio ?? null,
      college: d.college ?? null,
      course: d.course ?? null,
      graduationYear: d.graduationYear ?? null,
      phone: d.phone ?? null,
      skills: d.skills ?? "",
      interests: d.interests ?? "",
      codingLanguages: d.codingLanguages ?? "",
      projects: safeJson(d.projects, "[]"),
      certifications: safeJson(d.certifications, "[]"),
      profileVisibility: d.profileVisibility,
    },
  });
  return { success: "Profile saved." };
}

export async function updateMentorProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { getSessionUser } = await import("@/lib/auth");
  const user = await getSessionUser();
  if (!user || user.role !== "MENTOR") return { error: "You must be signed in as a mentor." };

  const parsed = mentorProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return flattenZod(parsed.error);
  const d = parsed.data;

  await prisma.user.update({ where: { id: user.id }, data: { fullName: d.fullName, avatarUrl: d.avatarUrl ?? null } });
  await prisma.mentorProfile.update({
    where: { userId: user.id },
    data: {
      title: d.title ?? null,
      organization: d.organization ?? null,
      yearsExperience: d.yearsExperience ?? null,
      expertise: d.expertise ?? "",
      skills: d.skills ?? "",
      bio: d.bio ?? null,
      phone: d.phone ?? null,
    },
  });
  return { success: "Profile saved." };
}

// ─── Join group ──────────────────────────────────────────────────────────────

export async function joinGroup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const meta = await requestMeta();
  const { getSessionUser } = await import("@/lib/auth");
  const user = await getSessionUser();
  if (!user || user.role !== "STUDENT") return { error: "You must be signed in as a student." };

  const parsed = joinGroupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return flattenZod(parsed.error);

  const code = parsed.data.code.trim();
  const group = await prisma.group.findFirst({
    where: { OR: [{ inviteCode: code }, { invitations: { some: { code, status: "PENDING", expiresAt: { gt: new Date() } } } }] },
    include: { mentor: { select: { fullName: true } } },
  });
  if (!group || !group.isActive) return { error: "That invite code is not valid. Double-check it with your mentor." };

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_studentId: { groupId: group.id, studentId: user.id } },
  });
  if (existing) return { error: `You are already a member of “${group.name}”.` };

  await prisma.$transaction(async (tx) => {
    await tx.groupMember.create({ data: { groupId: group.id, studentId: user.id } });
    // Set as primary mentor if the student has none yet
    const profile = await tx.studentProfile.findUnique({ where: { userId: user.id }, select: { mentorId: true } });
    if (profile && !profile.mentorId) {
      await tx.studentProfile.update({ where: { userId: user.id }, data: { mentorId: group.mentorId } });
    }
    // Mark pending email invitations used
    await tx.groupInvitation.updateMany({ where: { groupId: group.id, email: user.email, status: "PENDING" }, data: { status: "USED" } });
  });

  const { notify } = await import("@/lib/notifications");
  await notify({ userId: group.mentorId, type: "GROUP_JOINED", title: `${user.fullName} joined ${group.name}`, link: `/mentor/groups/${group.id}` });
  await audit({ actorId: user.id, action: "GROUP_JOINED", resource: "group", resourceId: group.id, ip: meta.ip });

  redirect("/student/group?joined=1");
}
