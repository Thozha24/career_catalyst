"use client";

import { useActionState, useState } from "react";
import { GraduationCap, UserPlus } from "lucide-react";
import { registerStudent, registerMentor, type ActionState } from "@/app/actions/auth";
import { Alert, Button, Input, Label, Select } from "@/components/ui";

export function RegisterForm({ role }: { role: "STUDENT" | "MENTOR" }) {
  const isStudent = role === "STUDENT";
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    isStudent ? registerStudent : registerMentor,
    null
  );
  const [showPw, setShowPw] = useState(false);
  const years = Array.from({ length: 12 }, (_, i) => new Date().getFullYear() + i);

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-700 ring-1 ring-inset ring-primary-100">
          {isStudent ? <GraduationCap className="h-3.5 w-3.5" /> : null}
          {isStudent ? "Student account" : "Mentor account"}
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isStudent ? "Start learning, practicing and earning points today." : "Start building your cohort of future builders."}
        </p>
      </div>

      {state?.error ? (
        <div className="mb-4">
          <Alert tone="danger">{state.error}</Alert>
        </div>
      ) : null}
      {state?.success ? (
        <div className="mb-4">
          <Alert tone="success">{state.success}</Alert>
        </div>
      ) : null}

      <form action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" name="fullName" required placeholder="Alex Johnson" autoComplete="name" />
            {state?.fieldErrors?.fullName ? <p className="mt-1 text-xs text-danger-600">{state.fieldErrors.fullName}</p> : null}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
            {state?.fieldErrors?.email ? <p className="mt-1 text-xs text-danger-600">{state.fieldErrors.email}</p> : null}
          </div>
          <div>
            <Label htmlFor="phone">Phone <span className="font-normal text-slate-400">(optional)</span></Label>
            <Input id="phone" name="phone" type="tel" placeholder="+1 555 000 1234" autoComplete="tel" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" name="password" type={showPw ? "text" : "password"} required minLength={8} placeholder="8+ chars, letters & numbers" autoComplete="new-password" className="pr-10" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={showPw ? "Hide password" : "Show password"}>
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
            {state?.fieldErrors?.password ? <p className="mt-1 text-xs text-danger-600">{state.fieldErrors.password}</p> : null}
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" name="confirmPassword" type={showPw ? "text" : "password"} required placeholder="Repeat password" autoComplete="new-password" />
            {state?.fieldErrors?.confirmPassword ? <p className="mt-1 text-xs text-danger-600">{state.fieldErrors.confirmPassword}</p> : null}
          </div>
        </div>

        {isStudent ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="college">College / institution</Label>
              <Input id="college" name="college" placeholder="State University" />
            </div>
            <div>
              <Label htmlFor="course">Course / degree</Label>
              <Input id="course" name="course" placeholder="B.Tech Computer Science" />
            </div>
            <div>
              <Label htmlFor="graduationYear">Graduation year</Label>
              <Select id="graduationYear" name="graduationYear" defaultValue="">
                <option value="">Select year</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="skills">Skills <span className="font-normal text-slate-400">(comma-separated)</span></Label>
              <Input id="skills" name="skills" placeholder="JavaScript, Python, HTML" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="interests">Areas of interest</Label>
              <Input id="interests" name="interests" placeholder="Web development, machine learning" />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="title">Professional title</Label>
              <Input id="title" name="title" placeholder="Senior Software Engineer" />
            </div>
            <div>
              <Label htmlFor="organization">Organization / company</Label>
              <Input id="organization" name="organization" placeholder="TechCorp" />
            </div>
            <div>
              <Label htmlFor="yearsExperience">Years of experience</Label>
              <Input id="yearsExperience" name="yearsExperience" type="number" min={0} max={60} placeholder="8" />
            </div>
            <div>
              <Label htmlFor="expertise">Areas of expertise</Label>
              <Input id="expertise" name="expertise" placeholder="React, system design" />
            </div>
            <div>
              <Label htmlFor="skills">Skills</Label>
              <Input id="skills" name="skills" placeholder="JavaScript, Node.js, AWS" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="bio">Short professional bio</Label>
              <textarea id="bio" name="bio" rows={3} className="input-base min-h-[80px]" placeholder="I mentor because..." />
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="avatarUrl">Profile photo URL <span className="font-normal text-slate-400">(optional)</span></Label>
          <Input id="avatarUrl" name="avatarUrl" type="url" placeholder="https://example.com/photo.jpg" />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Creating account…" : <>Create account <UserPlus className="ml-1.5 h-4 w-4" /></>}
        </Button>
        <p className="text-center text-xs leading-relaxed text-slate-400">
          By creating an account you agree to our terms. Passwords are hashed with bcrypt — we can never read them.
        </p>
      </form>
    </div>
  );
}
