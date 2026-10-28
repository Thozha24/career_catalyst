"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createGroupAction, type ActionState } from "@/app/actions/groups";
import { Alert, Button, Input, Label, Textarea } from "@/components/ui";

export function CreateGroupForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createGroupAction, null);

  useEffect(() => {
    if (state?.success) router.push(`/mentor/groups/${state.success}`);
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? <Alert tone="danger">{state.error}</Alert> : null}

      <div>
        <Label htmlFor="name">Group name</Label>
        <Input id="name" name="name" required placeholder="Frontend Development — Batch 2026" />
        {state?.fieldErrors?.name ? <p className="mt-1 text-xs text-danger-600">{state.fieldErrors.name}</p> : null}
      </div>
      <div>
        <Label htmlFor="description" hint="optional">Description</Label>
        <Textarea id="description" name="description" placeholder="Who is this group for and what will they learn?" />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        <Plus className="h-4 w-4" /> {pending ? "Creating…" : "Create Group"}
      </Button>
    </form>
  );
}
