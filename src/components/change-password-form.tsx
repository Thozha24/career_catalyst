"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { changePassword, type ActionState } from "@/app/actions/auth";
import { Alert, Button, Input, Label } from "@/components/ui";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(changePassword, null);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      {state?.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state?.success ? <Alert tone="success">{state.success}</Alert> : null}

      <div>
        <Label htmlFor="currentPassword">Current password</Label>
        <Input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" />
        {state?.fieldErrors?.currentPassword ? <p className="mt-1 text-xs text-danger-600">{state.fieldErrors.currentPassword}</p> : null}
      </div>
      <div>
        <Label htmlFor="newPassword">New password</Label>
        <Input id="newPassword" name="newPassword" type="password" required autoComplete="new-password" placeholder="8+ chars, letter & number" />
        {state?.fieldErrors?.newPassword ? <p className="mt-1 text-xs text-danger-600">{state.fieldErrors.newPassword}</p> : null}
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" />
        {state?.fieldErrors?.confirmPassword ? <p className="mt-1 text-xs text-danger-600">{state.fieldErrors.confirmPassword}</p> : null}
      </div>

      <Button type="submit" disabled={pending}>
        <KeyRound className="h-4 w-4" /> {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
