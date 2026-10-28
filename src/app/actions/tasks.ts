"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMentor, requireStudent, isGroupMentor, mentorCanAccessStudent } from "@/lib/guards";
import { createTaskSchema, taskSubmissionSchema, reviewSubmissionSchema } from "@/lib/validation";
import { awardPoints, touchStreak } from "@/lib/points";
import { checkAchievements } from "@/lib/achievements";
import { notify, notifyMany } from "@/lib/notifications";
import { audit } from "@/lib/audit";
import { limitOrThrow } from "@/lib/rate-limit";

export type ApiResult = { ok: boolean; error?: string; id?: string };

// ─── Mentor: create task ─────────────────────────────────────────────────────

export async function createTaskAction(payload: unknown): Promise<ApiResult> {
  const user = await requireMentor();
  limitOrThrow(`task-create:${user.id}`, 30, 60 * 60 * 1000);

  const parsed = createTaskSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid task." };
  }
  const d = parsed.data;

  if (!(await isGroupMentor(user.id, d.groupId))) {
    return { ok: false, error: "You can only assign tasks to your own groups." };
  }

  const members = await prisma.groupMember.findMany({
    where: { groupId: d.groupId, isActive: true },
    select: { studentId: true },
  });

  const task = await prisma.task.create({
    data: {
      title: d.title,
      description: d.description,
      instructions: d.instructions ?? null,
      dueDate: d.dueDate ? new Date(d.dueDate) : null,
      priority: d.priority,
      pointsAward: d.pointsAward,
      groupId: d.groupId,
      createdBy: user.id,
      resources: JSON.stringify(d.resources ?? []),
      assignments: { create: members.map((m) => ({ studentId: m.studentId })) },
    },
    select: { id: true, title: true },
  });

  await notifyMany(
    members.map((m) => m.studentId),
    {
      type: "NEW_TASK",
      title: `New task: ${task.title}`,
      body: d.dueDate ? `Due ${new Date(d.dueDate).toLocaleDateString()} · ${d.pointsAward} points` : `${d.pointsAward} points`,
      link: "/student/tasks",
    }
  );
  await audit({ actorId: user.id, action: "TASK_ASSIGNED", resource: "task", resourceId: task.id, metadata: { groupId: d.groupId, assignees: members.length } });

  revalidatePath("/mentor/tasks");
  return { ok: true, id: task.id };
}

// ─── Student: track status & submit work ─────────────────────────────────────

export async function updateTaskStatusAction(taskId: string, status: "NOT_STARTED" | "IN_PROGRESS"): Promise<ApiResult> {
  const user = await requireStudent();
  limitOrThrow(`task-status:${user.id}`, 60, 60 * 1000);

  const assignment = await prisma.taskAssignment.findUnique({
    where: { taskId_studentId: { taskId, studentId: user.id } },
    select: { id: true, status: true },
  });
  if (!assignment) return { ok: false, error: "This task is not assigned to you." };

  // Students may only move their own work forward — never past "submitted".
  if (["SUBMITTED", "REVIEWED", "COMPLETED"].includes(assignment.status)) {
    return { ok: false, error: "This task is already submitted." };
  }
  await prisma.taskAssignment.update({ where: { id: assignment.id }, data: { status } });
  revalidatePath("/student/tasks");
  return { ok: true };
}

export type SubmitTaskState = { error?: string; fieldErrors?: Record<string, string>; success?: string } | null;

export async function submitTaskAction(_prev: SubmitTaskState, formData: FormData): Promise<SubmitTaskState> {
  const user = await requireStudent();
  limitOrThrow(`task-submit:${user.id}`, 20, 60 * 60 * 1000);

  const parsed = taskSubmissionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }
  const d = parsed.data;

  const assignment = await prisma.taskAssignment.findUnique({
    where: { taskId_studentId: { taskId: d.taskId, studentId: user.id } },
    include: { task: { select: { id: true, title: true, createdBy: true, groupId: true } } },
  });
  if (!assignment) return { error: "This task is not assigned to you." };

  await prisma.$transaction(async (tx) => {
    await tx.taskSubmission.upsert({
      where: { taskId_studentId: { taskId: d.taskId, studentId: user.id } },
      create: { taskId: d.taskId, studentId: user.id, content: d.content, fileUrl: d.fileUrl ?? null, status: "SUBMITTED" },
      update: { content: d.content, fileUrl: d.fileUrl ?? null, status: "SUBMITTED", submittedAt: new Date(), feedback: null, reviewedAt: null, pointsAwarded: 0 },
    });
    await tx.taskAssignment.update({
      where: { id: assignment.id },
      data: { status: "SUBMITTED" },
    });
  });

  await notify({
    userId: assignment.task.createdBy,
    type: "NEW_TASK",
    title: `${user.fullName} submitted "${assignment.task.title}"`,
    body: "Review the submission and award points.",
    link: `/mentor/tasks/${assignment.task.id}`,
  });
  await touchStreak(user.id);
  revalidatePath("/student/tasks");
  revalidatePath(`/student/tasks/${d.taskId}`);
  return { success: "Work submitted! Your mentor will review it soon." };
}

// ─── Mentor: review submission ───────────────────────────────────────────────

export type ReviewResult = { ok: boolean; error?: string; achievements?: string[] };

export async function reviewSubmissionAction(payload: unknown): Promise<ReviewResult> {
  const user = await requireMentor();
  limitOrThrow(`task-review:${user.id}`, 60, 60 * 60 * 1000);

  const parsed = reviewSubmissionSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid review." };
  }
  const { submissionId, feedback, points, action } = parsed.data;

  const submission = await prisma.taskSubmission.findUnique({
    where: { id: submissionId },
    include: {
      task: { select: { id: true, title: true, pointsAward: true, groupId: true, createdBy: true } },
      student: { select: { id: true, fullName: true } },
    },
  });
  if (!submission) return { ok: false, error: "Submission not found." };

  // Authorization: only the group's mentor (or the task creator) reviews.
  const ownsGroup = await isGroupMentor(user.id, submission.task.groupId);
  if (!ownsGroup && submission.task.createdBy !== user.id) {
    return { ok: false, error: "You can only review submissions for your own groups." };
  }

  const newStatus = action === "COMPLETE" ? "COMPLETED" : "RESUBMIT";
  const pointsToAward = action === "COMPLETE" ? Math.min(points, submission.task.pointsAward) : 0;

  await prisma.$transaction([
    prisma.taskSubmission.update({
      where: { id: submissionId },
      data: { feedback: feedback ?? null, pointsAwarded: pointsToAward, status: newStatus, reviewedAt: new Date() },
    }),
    prisma.taskAssignment.update({
      where: { taskId_studentId: { taskId: submission.taskId, studentId: submission.studentId } },
      data: { status: newStatus },
    }),
  ]);

  let achievements: string[] = [];
  if (action === "COMPLETE") {
    if (pointsToAward > 0) {
      await awardPoints({
        studentId: submission.studentId,
        points: pointsToAward,
        reason: "MENTOR_AWARD",
        description: `Task completed: ${submission.task.title}`,
        taskId: submission.taskId,
      });
    }
    await prisma.studentProfile.update({
      where: { userId: submission.studentId },
      data: { tasksCompleted: { increment: 1 } },
    });
    achievements = await checkAchievements(submission.studentId);
  }

  await notify({
    userId: submission.studentId,
    type: "TASK_FEEDBACK",
    title: action === "COMPLETE" ? `Task completed: ${submission.task.title}` : `Resubmission requested: ${submission.task.title}`,
    body: feedback || (action === "COMPLETE" ? "Great work — marked complete." : "Please review the feedback and resubmit."),
    link: `/student/tasks/${submission.taskId}`,
  });
  await audit({
    actorId: user.id,
    action: "TASK_REVIEWED",
    resource: "task_submission",
    resourceId: submissionId,
    metadata: { result: newStatus, points: pointsToAward },
  });

  revalidatePath(`/mentor/tasks/${submission.taskId}`);
  return { ok: true, achievements };
}

// ─── Mentor: give standalone feedback to a student ───────────────────────────

export type FeedbackState = { error?: string; fieldErrors?: Record<string, string>; success?: string } | null;

export async function giveFeedbackAction(_prev: FeedbackState, formData: FormData): Promise<FeedbackState> {
  const user = await requireMentor();
  limitOrThrow(`feedback:${user.id}`, 30, 60 * 60 * 1000);

  const recipientId = String(formData.get("recipientId") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();
  const ratingRaw = String(formData.get("rating") ?? "");
  const rating = ratingRaw ? Number(ratingRaw) : undefined;

  if (comment.length < 5) return { error: "Feedback is too short.", fieldErrors: { comment: "Write at least a sentence." } };
  if (comment.length > 3000) return { error: "Feedback is too long." };
  if (rating !== undefined && (!Number.isInteger(rating) || rating < 1 || rating > 5)) return { error: "Rating must be 1–5." };

  if (!(await mentorCanAccessStudent(user.id, recipientId))) {
    return { error: "You can only leave feedback for students in your groups." };
  }

  await prisma.feedback.create({
    data: { authorId: user.id, recipientId, comment, rating: rating ?? null },
  });
  await notify({
    userId: recipientId,
    type: "MENTOR_FEEDBACK",
    title: `${user.fullName} left you feedback`,
    body: comment.slice(0, 120),
    link: "/student/mentor",
  });
  await audit({ actorId: user.id, action: "FEEDBACK_GIVEN", resource: "student", resourceId: recipientId });

  return { success: "Feedback sent." };
}
