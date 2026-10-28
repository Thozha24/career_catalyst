"use client";

import { useActionState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { requestPasswordReset, type ActionState } from "@/app/actions/auth";
import { Alert, Button, Input, Label } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(requestPasswordReset, null);

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
          <KeyRound className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">Reset your password</h1>
        <p className="mt-1.5 text-sm text-slate-500">Enter your email and we'll send you a reset link.</p>
      </div>

      {state?.success ? (
        <Alert tone="success">{state.success}</Alert>
      ) : (
        <form action={formAction} className="space-y-4">
          {state?.error ? <Alert tone="danger">{state.error}</Alert> : null}
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input id="email" name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        Remembered it?{" "}
        <Link href="/signin" className="font-semibold text-primary-600 hover:text-primary-700">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
