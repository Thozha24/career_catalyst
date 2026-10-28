"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { regenerateInviteCodeAction } from "@/app/actions/groups";
import { ConfirmButton } from "@/components/ui-client";
import { useToast } from "@/components/ui-client";

export function RotateInviteButton({ groupId }: { groupId: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [pending, startTransition] = useTransition();

  function rotate() {
    startTransition(async () => {
      const res = await regenerateInviteCodeAction(groupId);
      if (res.ok && res.code) {
        push("New invite code generated");
        router.refresh();
      } else {
        push(res.error ?? "Could not rotate the code.", "error");
      }
    });
  }

  return (
    <ConfirmButton
      onConfirm={rotate}
      confirmTitle="Rotate invite code?"
      confirmMessage="The current code stops working immediately. Share the new code with your students."
      confirmLabel="Rotate"
      variant="warning"
      size="sm"
      className="w-full"
    >
      <span className={pending ? "opacity-60" : ""}>
        <RefreshCw className="mr-1 inline h-3.5 w-3.5" /> Rotate code
      </span>
    </ConfirmButton>
  );
}
