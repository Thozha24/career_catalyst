"use client";

import { useActionState, useEffect } from "react";
import { Ban, Save, Zap } from "lucide-react";
import { adminUpdateUserAction, type AdminUserState } from "@/app/actions/admin";
import { Badge, Button, Select } from "@/components/ui";
import { useToast } from "@/components/ui-client";

/**
 * Client control: two intentional mutations — (1) change role, (2) suspend/reactivate.
 * Each submits only its own field so the action never rewrites unrelated data.
 */
export function UserAdminControls({
  userId,
  status,
  role,
}: {
  userId: string;
  status: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  role: "STUDENT" | "MENTOR" | "ADMIN";
}) {
  const [state, formAction, pending] = useActionState<AdminUserState, FormData>(adminUpdateUserAction, null);
  const { push } = useToast();

  useEffect(() => {
    if (state?.error) push(state.error, "error");
    if (state?.success) push(state.success);
  }, [state, push]);

  return (
    <>
      <form action={formAction} className="flex items-center gap-1.5">
        <input type="hidden" name="userId" value={userId} />
        <Select name="role" defaultValue={role} className="h-8 w-28 text-xs" aria-label={`Role for user ${userId}`}>
          <option value="STUDENT">Student</option>
          <option value="MENTOR">Mentor</option>
          <option value="ADMIN">Admin</option>
        </Select>
        <Button type="submit" variant="outline" size="sm" disabled={pending} aria-busy={pending}>
          <Save className="h-3.5 w-3.5" /> Role
        </Button>
      </form>
      <form action={formAction}>
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="status" value={status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED"} />
        <Button type="submit" variant={status === "SUSPENDED" ? "success" : "danger"} size="sm" disabled={pending} aria-busy={pending}>
          {status === "SUSPENDED" ? (<><Zap className="h-3.5 w-3.5" /> Reactivate</>) : (<><Ban className="h-3.5 w-3.5" /> Suspend</>)}
        </Button>
      </form>
      {state?.fieldErrors?.status ? <Badge tone="danger">{state.fieldErrors.status}</Badge> : null}
    </>
  );
}
