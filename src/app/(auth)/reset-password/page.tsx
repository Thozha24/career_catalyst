"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { resetPassword, type ActionState } from "@/app/actions/auth";
import { Alert, Button, Input, Label } from "@/components/ui";

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, formAction, pending] = useActionState<ActionState, FormData>(resetPassword, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {state?.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state?.fieldErrors?.token ? <Alert tone="danger">{state.fieldErrors.token}</Alert> : null}
      <div>
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" required minLength={8} placeholder="8+ chars, letters & numbers" autoComplete="new-password" />
        {state?.fieldErrors?.password ? <p className="mt-1 text-xs text-danger-600">{state.fieldErrors.password}</p> : null}
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" />
        {state?.fieldErrors?.confirmPassword ? <p className="mt-1 text-xs text-danger-600">{state.fieldErrors.confirmPassword}</p> : null}
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending || !token}>
        {pending ? "Updating…" : token ? "Update password" : "Missing token — request a new link"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="animate-fade-in-up">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Choose a new password</h1>
        <p className="mt-1.5 text-sm text-slate-500">Pick something strong — you're the only one who'll know it.</p>
      </div>
      <ResetForm />
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/signin" className="font-semibold text-primary-600 hover:text-primary-700">Back to sign in</Link>
      </p>
    </div>
  );
}
