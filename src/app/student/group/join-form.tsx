"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { joinGroup, type ActionState } from "@/app/actions/auth";
import { Alert, Button, Input, Label } from "@/components/ui";

export function JoinGroupForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(joinGroup, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? <Alert tone="danger">{state.error}</Alert> : null}

      <div>
        <Label htmlFor="code">Invite code</Label>
        <Input id="code" name="code" required placeholder="e.g. cc-frontend-2026" className="font-mono" />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        <KeyRound className="h-4 w-4" /> {pending ? "Joining…" : "Join Group"}
      </Button>

      <p className="text-xs text-slate-400">Codes look like “cc-xxxxxx” and come from your mentor.</p>
    </form>
  );
}
