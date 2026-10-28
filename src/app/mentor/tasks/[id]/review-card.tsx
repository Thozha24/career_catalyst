"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, RotateCcw, Loader2, Link2, Zap } from "lucide-react";
import { Card, CardHeader, CardBody, Badge, Button, Input, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui-client";
import { reviewSubmissionAction } from "@/app/actions/tasks";
import { formatDateTime } from "@/lib/format";

type Sub = {
  id: string;
  studentName: string;
  content: string;
  fileUrl: string | null;
  status: string;
  pointsAwarded: number;
  feedback: string | null;
  submittedAt: string;
  reviewedAt: string | null;
};

export function ReviewCard({ submission, maxPoints }: { submission: Sub; maxPoints: number }) {
  const router = useRouter();
  const { push } = useToast();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [points, setPoints] = useState<string>(String(submission.pointsAwarded || maxPoints));
  const [lastAction, setLastAction] = useState<string | null>(null);

  function review(action: "COMPLETE" | "REQUEST_RESUBMISSION") {
    setLastAction(action);
    startTransition(async () => {
      const res = await reviewSubmissionAction({
        submissionId: submission.id,
        feedback: feedback || undefined,
        points: action === "COMPLETE" ? Math.max(0, Math.min(maxPoints, Number(points) || 0)) : 0,
        action,
      });
      if (!res.ok) {
        push(res.error ?? "Could not save the review.", "error");
        return;
      }
      if (action === "COMPLETE") {
        push(res.achievements && res.achievements.length > 0 ? `Completed — achievement unlocked: ${res.achievements[0]} 🏆` : "Task completed & points awarded ⚡");
      } else {
        push("Resubmission requested");
      }
      router.refresh();
    });
  }

  const alreadyReviewed = ["COMPLETED", "RESUBMIT"].includes(submission.status);

  return (
    <Card>
      <CardHeader
        title={submission.studentName}
        subtitle={`Submitted ${formatDateTime(submission.submittedAt)}${submission.reviewedAt ? ` · reviewed ${formatDateTime(submission.reviewedAt)}` : ""}`}
        action={<Badge tone={submission.status === "COMPLETED" ? "success" : submission.status === "RESUBMIT" ? "danger" : "warning"}>{submission.status.replaceAll("_", " ").toLowerCase()}</Badge>}
      />
      <CardBody className="space-y-4">
        <div className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">{submission.content}</div>
        {submission.fileUrl ? (
          <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:underline">
            <Link2 className="h-4 w-4" /> Attached link
          </a>
        ) : null}

        {!alreadyReviewed ? (
          <div className="space-y-3 rounded-xl border border-slate-100 p-4">
            <div>
              <label htmlFor={`fb-${submission.id}`} className="label-base">Feedback</label>
              <Textarea id={`fb-${submission.id}`} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="What was good, what to improve…" className="min-h-[80px]" />
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor={`pts-${submission.id}`} className="label-base">Points (0–{maxPoints})</label>
                <Input id={`pts-${submission.id}`} type="number" min={0} max={maxPoints} value={points} onChange={(e) => setPoints(e.target.value)} className="w-28" />
              </div>
              <Button variant="success" onClick={() => review("COMPLETE")} disabled={pending}>
                {pending && lastAction === "COMPLETE" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Complete & award
              </Button>
              <Button variant="warning" onClick={() => review("REQUEST_RESUBMISSION")} disabled={pending}>
                {pending && lastAction === "REQUEST_RESUBMISSION" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Request resubmission
              </Button>
            </div>
            <p className="text-xs text-slate-400">Points are credited by the platform ledger when you mark complete.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-primary-100 bg-primary-50/60 p-4">
            {submission.feedback ? (
              <p className="whitespace-pre-wrap text-sm text-slate-700"><strong>Your feedback:</strong> {submission.feedback}</p>
            ) : (
              <p className="text-sm text-slate-500">Reviewed without written feedback.</p>
            )}
            {submission.pointsAwarded > 0 ? (
              <p className="mt-1.5 flex items-center gap-1 text-sm font-semibold text-success-700"><Zap className="h-3.5 w-3.5" /> {submission.pointsAwarded} points awarded</p>
            ) : null}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
