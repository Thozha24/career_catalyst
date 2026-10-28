"use client";

import { useActionState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { giveFeedbackAction, type FeedbackState } from "@/app/actions/tasks";
import { Alert, Button, Input, Label, Textarea } from "@/components/ui";

export function FeedbackForm({ studentId }: { studentId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<FeedbackState, FormData>(async (prev, fd) => {
    fd.set("recipientId", studentId);
    return giveFeedbackAction(prev, fd);
  }, null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      {state?.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state?.success ? <Alert tone="success">{state.success}</Alert> : null}

      <div>
        <Label htmlFor="comment">Comment</Label>
        <Textarea id="comment" name="comment" required placeholder="e.g. Great improvement on your last two tests — focus next on array methods…" />
        {state?.fieldErrors?.comment ? <p className="mt-1 text-xs text-danger-600">{state.fieldErrors.comment}</p> : null}
      </div>

      <div>
        <Label htmlFor="rating" hint="optional">Rating (1–5)</Label>
        <Input id="rating" name="rating" type="number" min={1} max={5} placeholder="4" />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        <Send className="h-4 w-4" /> {pending ? "Sending…" : "Send feedback"}
      </Button>
    </form>
  );
}
