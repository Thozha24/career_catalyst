"use client";

import { useActionState, useEffect } from "react";
import { Send } from "lucide-react";
import { submitTaskAction, type SubmitTaskState } from "@/app/actions/tasks";
import { Alert, Button, Input, Label, Textarea } from "@/components/ui";

export function TaskWorkForm({
  taskId,
  defaultContent,
  defaultFileUrl,
}: {
  taskId: string;
  defaultContent: string;
  defaultFileUrl: string;
}) {
  const [state, formAction, pending] = useActionState<SubmitTaskState, FormData>(async (prev, fd) => {
    fd.set("taskId", taskId);
    return submitTaskAction(prev, fd);
  }, null);

  useEffect(() => {
    if (state?.success) window.location.reload();
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state?.success ? <Alert tone="success">{state.success}</Alert> : null}

      <div>
        <Label htmlFor="content">Your work</Label>
        <Textarea
          id="content"
          name="content"
          required
          defaultValue={defaultContent}
          placeholder="Describe what you built, paste your code, or summarize your findings… (min 10 characters)"
          className="min-h-[160px]"
        />
        {state?.fieldErrors?.content ? <p className="mt-1 text-xs text-danger-600">{state.fieldErrors.content}</p> : null}
      </div>

      <div>
        <Label htmlFor="fileUrl" hint="optional">Link (GitHub repo, demo, doc…)</Label>
        <Input id="fileUrl" name="fileUrl" type="url" defaultValue={defaultFileUrl} placeholder="https://github.com/you/project" />
        {state?.fieldErrors?.fileUrl ? <p className="mt-1 text-xs text-danger-600">{state.fieldErrors.fileUrl}</p> : null}
      </div>

      <Button type="submit" disabled={pending}>
        <Send className="h-4 w-4" /> {pending ? "Submitting…" : "Submit work"}
      </Button>
    </form>
  );
}
