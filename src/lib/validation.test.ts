import {
  passwordSchema,
  studentRegisterSchema,
  mentorRegisterSchema,
  createTestSchema,
  createTaskSchema,
  taskSubmissionSchema,
  adminUpdateUserSchema,
  csvList,
} from "./validation";

describe("passwordSchema", () => {
  it("requires length, a letter and a number", () => {
    expect(passwordSchema.safeParse("short1").success).toBe(false);
    expect(passwordSchema.safeParse("onlyletterslong").success).toBe(false);
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
    expect(passwordSchema.safeParse("GoodPass123").success).toBe(true);
  });

  it("caps pathological lengths", () => {
    expect(passwordSchema.safeParse("a1".repeat(200)).success).toBe(false);
  });
});

describe("registration schemas", () => {
  it("rejects mismatched passwords", () => {
    const result = studentRegisterSchema.safeParse({
      fullName: "Alex Chen",
      email: "alex@example.com",
      password: "Passw0rd12",
      confirmPassword: "Passw0rd99",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("confirmPassword"))).toBe(true);
    }
  });

  it("accepts a valid student and lowercases/normalizes email", () => {
    const result = studentRegisterSchema.safeParse({
      fullName: "Priya Nair",
      email: "  PRIYA@Example.COM ",
      password: "Passw0rd12",
      confirmPassword: "Passw0rd12",
      graduationYear: "2027",
      skills: "React, TypeScript,",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("priya@example.com");
      expect(result.data.graduationYear).toBe(2027);
      expect(result.data.skills).toBe("React, TypeScript,"); // raw passthrough — actions split later

    }
  });

  it("rejects the same payload for mentors with bad experience years", () => {
    const base = {
      fullName: "Morgan Reyes",
      email: "morgan@example.com",
      password: "Passw0rd12",
      confirmPassword: "Passw0rd12",
    };
    expect(mentorRegisterSchema.safeParse({ ...base, yearsExperience: "61" }).success).toBe(false);
    expect(mentorRegisterSchema.safeParse({ ...base, yearsExperience: "-1" }).success).toBe(false);
    expect(mentorRegisterSchema.safeParse({ ...base, yearsExperience: "8" }).success).toBe(true);
  });

  it("rejects junk emails", () => {
    const result = studentRegisterSchema.safeParse({ fullName: "X Y", email: "nope", password: "Passw0rd12", confirmPassword: "Passw0rd12" });
    expect(result.success).toBe(false);
  });
});

describe("test & task schemas", () => {
  const question = { type: "MCQ", prompt: "What is 2+2?", options: [{ text: "4", isCorrect: true }] };

  it("enforces duration bounds and requires questions", () => {
    const base = { title: "Quiz One", groupId: "g1", questions: [question] };
    expect(createTestSchema.safeParse({ ...base, durationMin: "30" }).success).toBe(true);
    expect(createTestSchema.safeParse({ ...base, durationMin: "2" }).success).toBe(false);
    expect(createTestSchema.safeParse({ ...base, durationMin: "400" }).success).toBe(false);
    expect(createTestSchema.safeParse({ ...base, durationMin: "30", questions: [] }).success).toBe(false);
  });

  it("validates availability window ordering", () => {
    const base = { title: "Windowed", groupId: "g1", durationMin: "30", questions: [question] };
    const result = createTestSchema.safeParse({
      ...base,
      availableFrom: "2026-01-02T00:00:00Z",
      availableUntil: "2026-01-01T00:00:00Z",
    });
    expect(result.success).toBe(false);
  });

  it("rejects out-of-range passing scores", () => {
    const base = { title: "Quiz One", groupId: "g", durationMin: "30", questions: [question] };
    expect(createTestSchema.safeParse({ ...base, passingScore: "101" }).success).toBe(false);
    expect(createTestSchema.safeParse({ ...base, passingScore: "-1" }).success).toBe(false);
    expect(createTestSchema.safeParse({ ...base, passingScore: "75" }).success).toBe(true);
  });

  it("caps task point awards to keep admin/mentor input sane", () => {
    const base = { title: "Build a landing page", description: "Ship a responsive page.", groupId: "g1" };
    expect(createTaskSchema.safeParse({ ...base, pointsAward: "500" }).success).toBe(true);
    expect(createTaskSchema.safeParse({ ...base, pointsAward: "5000" }).success).toBe(false);
    expect(createTaskSchema.safeParse({ ...base, priority: "URGENT" }).success).toBe(false);
  });

  it("task submissions require meaningful content and a valid file URL", () => {
    const taskId = "task1";
    expect(taskSubmissionSchema.safeParse({ taskId, content: "tiny" }).success).toBe(false);
    expect(taskSubmissionSchema.safeParse({ taskId, content: "Here is my completed landing page with sources." }).success).toBe(true);
    expect(taskSubmissionSchema.safeParse({ taskId, content: "Here is my completed landing page.", fileUrl: "not-a-url" }).success).toBe(false);
  });
});

describe("admin & misc", () => {
  it("admin user update only allows real statuses/roles", () => {
    expect(adminUpdateUserSchema.safeParse({ userId: "u1", status: "SUSPENDED" }).success).toBe(true);
    expect(adminUpdateUserSchema.safeParse({ userId: "u1", role: "WIZARD" }).success).toBe(false);
    expect(adminUpdateUserSchema.safeParse({ userId: "" }).success).toBe(false);
  });

  it("csvList normalizes a bounded skill list", () => {
    expect(csvList(3).parse("React,, TypeScript , Node, Rust, Go")).toBe("React, TypeScript, Node");
  });
});
