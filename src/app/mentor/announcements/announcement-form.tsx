"use client";

import { useActionState, useState } from "react";
import { Megaphone, Send } from "lucide-react";
import { createAnnouncementAction, type AnnouncementState } from "@/app/actions/engagement";
import { Alert, Button, Input, Label, Select, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui-client";
import { useEffect } from "react";

type GroupOption = { id: string; name: string; _count: { members: number } };

export function AnnouncementForm({ groups, defaultGroupId }: { groups: GroupOption[]; defaultGroupId?: string }) {
  const [state, formAction, pending] = useActionState<AnnouncementState, FormData>(createAnnouncementAction, null);
  const { push } = useToast();
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (state?.success) {
      push(state.success);
      setKey((k) => k + 1); // reset fields after successful post
    }
  }, [state, push]);

  return (
    <form key={key} action={formAction} className="space-y-4" data-testid="announcement-form">
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

      <div>
        <Label htmlFor="announcement-group">Group</Label>
        <Select id="announcement-group" name="groupId" defaultValue={defaultGroupId ?? groups[0]?.id} required>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} · {g._count.members} members
            </option>
          ))}
        </Select>
        {state?.fieldErrors?.groupId ? <p className="mt-1 text-xs text-danger-600">{state.fieldErrors.groupId}</p> : null}
      </div>

      <div>
        <Label htmlFor="announcement-title">Title</Label>
        <Input id="announcement-title" name="title" maxLength={120} placeholder="Live session this Saturday @ 6pm" required />
        {state?.fieldErrors?.title ? <p className="mt-1 text-xs text-danger-600">{state.fieldErrors.title}</p> : null}
      </div>

      <div>
        <Label htmlFor="announcement-body">Message</Label>
        <Textarea id="announcement-body" name="body" maxLength={2000} placeholder="What do your students need to know?" required />
        {state?.fieldErrors?.body ? <p className="mt-1 text-xs text-danger-600">{state.fieldErrors.body}</p> : null}
      </div>

      <Button type="submit" className="w-full" disabled={pending} aria-busy={pending}>
        {pending ? "Posting…" : (<>
          <Megaphone className="mr-1.5 h-4 w-4" />
          Post announcement
          <Send className="ml-1.5 h-4 w-4" />
        </>)}
      </Button>
    </form>
  );
}
