"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Loader2, PenLine, Save, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { Card, CardHeader, CardBody, Badge, Button, Progress } from "@/components/ui";
import { useToast } from "@/components/ui-client";
import { gradeAttemptAction } from "@/app/actions/tests";
import { formatDuration } from "@/lib/format";

type GradingQuestion = {
  id: string;
  type: "MCQ" | "MULTI_SELECT" | "TRUE_FALSE" | "SHORT_ANSWER" | "CODING";
  prompt: string;
  marks: number;
  manual: boolean;
  options: { id: string; text: string; isCorrect: boolean }[];
};

type GradingAttempt = {
  id: string;
  studentId: string;
  studentName: string;
  percentage: number;
  passed: boolean;
  timeTakenSec: number | null;
  score: number;
  maxScore: number | null;
  answers: {
    questionId: string;
    isCorrect: boolean | null;
    marksAwarded: number;
    textAnswer: string | null;
    codeAnswer: string | null;
  }[];
};

const TYPE_LABEL: Record<GradingQuestion["type"], string> = {
  MCQ: "Multiple choice",
  MULTI_SELECT: "Multiple select",
  TRUE_FALSE: "True / false",
  SHORT_ANSWER: "Short answer",
  CODING: "Coding",
};

export function AwaitingGrading() {
  return <p className="text-sm text-slate-400">Waiting for submissions.</p>;
}

export function GradeTable({
  testId,
  passingScore,
  questions,
  attempts,
}: {
  testId: string;
  passingScore: number;
  questions: GradingQuestion[];
  attempts: GradingAttempt[];
}) {
  const [openId, setOpenId] = useState<string | null>(attempts[0]?.id ?? null);
  const maxScore = questions.reduce((s, q) => s + q.marks, 0);

  return (
    <Card>
      <CardHeader
        title="Results & grading"
        subtitle={`${attempts.length} submission${attempts.length === 1 ? "" : "s"} · pass mark ${passingScore}% · max ${maxScore} points`}
        icon={<PenLine className="h-4 w-4" />}
      />
      <CardBody className="space-y-3">
        {attempts.map((a) => (
          <AttemptRow
            key={a.id}
            attempt={a}
            questions={questions}
            open={openId === a.id}
            onToggle={() => setOpenId(openId === a.id ? null : a.id)}
          />
        ))}
      </CardBody>
    </Card>
  );
}

function AttemptRow({
  attempt,
  questions,
  open,
  onToggle,
}: {
  attempt: GradingAttempt;
  questions: GradingQuestion[];
  open: boolean;
  onToggle: () => void;
}) {
  const { push } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);

  const needsGrading = attempt.answers.some((ans) => {
    const q = questions.find((x) => x.id === ans.questionId);
    return q?.manual && ans.isCorrect === null && (ans.textAnswer || ans.codeAnswer);
  });

  return (
    <div className={cn("overflow-hidden rounded-xl border transition-colors", open ? "border-primary-200 bg-primary-50/30" : "border-slate-100")}>
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-3 text-left" aria-expanded={open}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-secondary-600 text-xs font-bold text-white">
          {attempt.studentName.split(" ").map((p) => p[0]?.toUpperCase()).slice(0, 2).join("")}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-ink">{attempt.studentName}</span>
          <span className="block text-xs text-slate-400">
            {attempt.score}/{attempt.maxScore ?? "?"} marks · {attempt.timeTakenSec != null ? formatDuration(attempt.timeTakenSec) : "—"}
          </span>
        </span>
        {needsGrading ? <Badge tone="warning"><PenLine className="h-3 w-3" /> Needs grading</Badge> : null}
        <Badge tone={attempt.passed ? "success" : "danger"}>{attempt.percentage}%</Badge>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <div className="border-t border-slate-100 px-4 py-4">
          <Progress value={attempt.percentage} tone={attempt.passed ? "success" : "danger"} className="mb-4" />
          <div className="space-y-4">
            {questions.map((q, qi) => {
              const ans = attempt.answers.find((x) => x.questionId === q.id);
              const unanswered = !ans || (!ans.textAnswer && !ans.codeAnswer && (ans.marksAwarded === 0 || ans.isCorrect !== null) && ans.isCorrect === null && q.options.length === 0);
              return (
                <div key={q.id} className="rounded-xl border border-slate-100 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">{qi + 1}. {q.prompt}</p>
                    <Badge tone="neutral">{TYPE_LABEL[q.type]} · {q.marks} mark{q.marks === 1 ? "" : "s"}</Badge>
                  </div>

                  {/* Objective: show correctness + selected options */}
                  {q.options.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {q.options.map((o) => (
                        <li key={o.id} className={cn("rounded-lg px-3 py-1.5 text-sm", o.isCorrect ? "bg-success-50 font-medium text-success-800" : "text-slate-500")}>
                          {o.isCorrect ? "✓ " : "• "}{o.text}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {/* Manual: show the answer + grading input */}
                  {q.manual ? (
                    <ManualGradeInput
                      attemptId={attempt.id}
                      questionId={q.id}
                      questionLabel={`Q${qi + 1}`}
                      maxMarks={q.marks}
                      textAnswer={ans?.textAnswer ?? null}
                      codeAnswer={ans?.codeAnswer ?? null}
                      current={ans?.marksAwarded ?? 0}
                      graded={ans?.isCorrect !== null && ans !== undefined}
                      onSaved={() => {
                        push("Grades saved");
                        router.refresh();
                      }}
                    />
                  ) : (
                    <p className="mt-2 text-xs">
                      {ans?.isCorrect === true ? (
                        <span className="font-medium text-success-700">✓ Correct · {ans.marksAwarded}/{q.marks}</span>
                      ) : ans?.isCorrect === false ? (
                        <span className="font-medium text-danger-700">✗ Incorrect · {ans.marksAwarded}/{q.marks}</span>
                      ) : (
                        <span className="text-slate-400">Not answered · 0/{q.marks}</span>
                      )}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ManualGradeInput({
  attemptId,
  questionId,
  questionLabel,
  maxMarks,
  textAnswer,
  codeAnswer,
  current,
  graded,
  onSaved,
}: {
  attemptId: string;
  questionId: string;
  questionLabel: string;
  maxMarks: number;
  textAnswer: string | null;
  codeAnswer: string | null;
  current: number;
  graded: boolean;
  onSaved: () => void;
}) {
  const { push } = useToast();
  const [value, setValue] = useState<string>(String(current));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await gradeAttemptAction(attemptId, [{ questionId, marksAwarded: Number(value) || 0 }]);
      if (!res.ok) {
        push(res.error ?? "Could not save the grade.", "error");
      } else {
        push(`${questionLabel} graded`);
        onSaved();
      }
    } catch {
      push("Network error while saving.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      {textAnswer ? (
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Student answer</p>
          <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700">{textAnswer}</p>
        </div>
      ) : null}
      {codeAnswer ? (
        <pre className="code-editor max-h-56 overflow-auto rounded-lg p-3 text-xs">{codeAnswer}</pre>
      ) : null}

      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-slate-500" htmlFor={`mark-${attemptId}-${questionId}`}>
          Marks (0–{maxMarks}):
        </label>
        <input
          id={`mark-${attemptId}-${questionId}`}
          type="number"
          min={0}
          max={maxMarks}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="input-base h-9 w-20"
          aria-label={`Marks for ${questionLabel}`}
        />
        <Button size="sm" variant={graded ? "outline" : "primary"} onClick={() => void save()} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {graded ? "Update" : "Save"}
        </Button>
        {graded ? <Badge tone="success"><Check className="h-3 w-3" /> Graded</Badge> : null}
      </div>
    </div>
  );
}
