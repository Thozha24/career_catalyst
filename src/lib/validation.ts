import { z } from "zod";

/** Server-side validation schemas — the single source of truth for input validation. */

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(200);

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password is too long.")
  .regex(/[a-zA-Z]/, "Password must contain a letter.")
  .regex(/[0-9]/, "Password must contain a number.");

export const nameSchema = z.string().trim().min(2, "Name is too short.").max(100);

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal("").transform(() => undefined));

export const csvList = (max: number) =>
  z
    .string()
    .max(1000)
    .transform((s) =>
      s
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, max)
        .join(", ")
    )
    .optional()
    .or(z.literal("").transform(() => ""));

export const studentRegisterSchema = z
  .object({
    fullName: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    phone: optionalText(20),
    college: optionalText(150),
    course: optionalText(150),
    graduationYear: z.coerce
      .number()
      .int()
      .min(1990)
      .max(2100)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    skills: z.string().max(1000).optional(),
    interests: z.string().max(1000).optional(),
    avatarUrl: z.string().trim().url().max(500).optional().or(z.literal("").transform(() => undefined)),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const mentorRegisterSchema = z
  .object({
    fullName: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    phone: optionalText(20),
    title: optionalText(150),
    organization: optionalText(150),
    yearsExperience: z.coerce
      .number()
      .int()
      .min(0)
      .max(60)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    expertise: z.string().max(1000).optional(),
    skills: z.string().max(1000).optional(),
    bio: optionalText(2000),
    avatarUrl: z.string().trim().url().max(500).optional().or(z.literal("").transform(() => undefined)),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(128),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10).max(200),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const joinGroupSchema = z.object({
  code: z.string().trim().min(4, "Enter an invite code.").max(100),
});

export const createGroupSchema = z.object({
  name: z.string().trim().min(3, "Group name is too short.").max(120),
  description: optionalText(500),
});

export const taskStatusEnum = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "SUBMITTED",
  "REVIEWED",
  "COMPLETED",
  "RESUBMIT",
]);

export const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const questionTypeEnum = z.enum(["MCQ", "MULTI_SELECT", "TRUE_FALSE", "SHORT_ANSWER", "CODING"]);

export const questionInputSchema = z.object({
  type: questionTypeEnum,
  prompt: z.string().trim().min(3, "Question text is required.").max(2000),
  marks: z.coerce.number().int().min(1).max(100).default(1),
  negativeMarks: z.coerce.number().int().min(0).max(100).default(0),
  explanation: optionalText(2000),
  options: z
    .array(
      z.object({
        text: z.string().trim().min(1, "Option text is required.").max(500),
        isCorrect: z.boolean().default(false),
      })
    )
    .max(10)
    .default([]),
});

export const createTestSchema = z
  .object({
    title: z.string().trim().min(3, "Title is required.").max(150),
    description: optionalText(1000),
    durationMin: z.coerce.number().int().min(5, "Minimum duration is 5 minutes.").max(300),
    groupId: z.string().min(1, "Choose a group."),
    availableFrom: z.string().optional(),
    availableUntil: z.string().optional(),
    passingScore: z.coerce.number().int().min(0).max(100).default(50),
    negativeMarking: z.coerce.boolean().default(false),
    questions: z.array(questionInputSchema).min(1, "Add at least one question.").max(100),
  })
  .refine((d) => !d.availableFrom || !d.availableUntil || d.availableFrom < d.availableUntil, {
    message: "End time must be after start time.",
    path: ["availableUntil"],
  });

export const createTaskSchema = z.object({
  title: z.string().trim().min(3, "Title is required.").max(150),
  description: z.string().trim().min(3, "Description is required.").max(5000),
  instructions: optionalText(5000),
  dueDate: z.string().optional(),
  priority: priorityEnum.default("MEDIUM"),
  pointsAward: z.coerce.number().int().min(0).max(1000).default(50),
  groupId: z.string().min(1, "Choose a group."),
  resources: z
    .array(z.object({ name: z.string().trim().max(120), url: z.string().trim().url().max(500) }))
    .max(20)
    .default([]),
});

export const taskSubmissionSchema = z.object({
  taskId: z.string().min(1),
  content: z.string().trim().min(10, "Tell us a bit more about your work (min 10 characters).").max(20000),
  fileUrl: z.string().trim().url().max(500).optional().or(z.literal("").transform(() => undefined)),
});

export const reviewSubmissionSchema = z.object({
  submissionId: z.string().min(1),
  feedback: z.string().trim().max(5000).optional(),
  points: z.coerce.number().int().min(0).max(1000).default(0),
  action: z.enum(["COMPLETE", "REQUEST_RESUBMISSION"]),
});

export const submitTestSchema = z.object({
  attemptId: z.string().min(1),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        selectedOptionIds: z.array(z.string().max(100)).max(20).default([]),
        textAnswer: z.string().max(5000).nullable().optional(),
        codeAnswer: z.string().max(20000).nullable().optional(),
      })
    )
    .max(200),
});

export const autosaveAnswerSchema = z.object({
  attemptId: z.string().min(1),
  questionId: z.string().min(1),
  selectedOptionIds: z.array(z.string().max(100)).max(20).default([]),
  textAnswer: z.string().max(5000).nullable().optional(),
  codeAnswer: z.string().max(20000).nullable().optional(),
});

export const runCodeSchema = z.object({
  problemId: z.string().min(1),
  language: z.enum(["javascript", "python", "java", "cpp"]),
  code: z.string().max(20000),
});

export const submitCodeSchema = runCodeSchema;

export const feedbackSchema = z.object({
  recipientId: z.string().min(1),
  comment: z.string().trim().min(5, "Feedback is too short.").max(3000),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

export const announcementSchema = z.object({
  groupId: z.string().min(1),
  title: z.string().trim().min(3).max(150),
  body: z.string().trim().min(3).max(5000),
});

export const studentProfileSchema = z.object({
  fullName: nameSchema,
  bio: optionalText(2000),
  college: optionalText(150),
  course: optionalText(150),
  graduationYear: z.coerce
    .number()
    .int()
    .min(1990)
    .max(2100)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  phone: optionalText(20),
  skills: z.string().max(1000).optional(),
  interests: z.string().max(1000).optional(),
  codingLanguages: z.string().max(500).optional(),
  projects: z.string().max(10000).optional(), // JSON string, validated at parse site
  certifications: z.string().max(10000).optional(),
  profileVisibility: z.enum(["PRIVATE", "GROUP", "PUBLIC"]).default("GROUP"),
  avatarUrl: z.string().trim().url().max(500).optional().or(z.literal("").transform(() => undefined)),
});

export const mentorProfileSchema = z.object({
  fullName: nameSchema,
  title: optionalText(150),
  organization: optionalText(150),
  yearsExperience: z.coerce
    .number()
    .int()
    .min(0)
    .max(60)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  expertise: z.string().max(1000).optional(),
  skills: z.string().max(1000).optional(),
  bio: optionalText(2000),
  phone: optionalText(20),
  avatarUrl: z.string().trim().url().max(500).optional().or(z.literal("").transform(() => undefined)),
});

export const lessonCompleteSchema = z.object({ lessonId: z.string().min(1) });

export const quizSubmitSchema = z.object({
  lessonId: z.string().min(1),
  answers: z.array(z.coerce.number().int().min(0).max(20)).max(20),
});

export const codingStarterSchema = z.record(z.string().max(20000));

export const adminUpdateUserSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  role: z.enum(["STUDENT", "MENTOR", "ADMIN"]).optional(),
});
