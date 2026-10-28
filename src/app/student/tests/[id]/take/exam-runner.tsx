"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Clock,
  ListChecks, Loader2, Save, Send,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Alert, Badge, Button, Card, CardBody, Progress } from "@/components/ui";
import { useToast } from "@/components/ui-client";
import { startAttemptAction } from "@/app/actions/tests";

type Q = {
  id: string;
  type: "MCQ" | "MULTI_SELECT" | "TRUE_FALSE" | "SHORT_ANSWER" | "CODING";
  prompt: string;
  marks: number;
  options: { id: string; text: string }[];
};

type AnswerDraft = {
  selectedOptionIds: string[];
  textAnswer: string;
  codeAnswer: string;
};

const TYPE_LABEL: Record<Q["type"], string> = {
  MCQ: "Multiple choice",
  MULTI_SELECT: "Multiple select",
  TRUE_FALSE: "True / false",
  SHORT_ANSWER: "Short answer",
  CODING: "Coding",
};

function emptyAnswer(): AnswerDraft {
  return { selectedOptionIds: [], textAnswer: "", codeAnswer: "" };
}

function fmtClock(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":");
}

/**
 * Starts an attempt via the server action (which enforces membership + window)
 * then hands off to the runner. Also renders "not available" states.
 */
export function AttemptGate({ testId }: { testId: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  async function start() {
    setStarting(true);
    setError(null);
    const res = await startAttemptAction(testId);
    if (!res.ok) {
      setError(res.error ?? "Could not start this test.");
      setStarting(false);
      return;
    }
    router.refresh();
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardBody className="space-y-4 py-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
          <ListChecks className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink">Ready to begin?</h2>
          <p className="mt-1 text-sm text-slate-500">
            The timer starts as soon as you press the button. Answers autosave every few seconds.
          </p>
        </div>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Button size="lg" onClick={start} disabled={starting} className="w-full">
          {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Start Test
        </Button>
      </CardBody>
    </Card>
  );
}

export function ExamRunner({
  testId,
  testTitle,
  attemptId,
  durationMin,
  remainingSec,
  questions,
  initialAnswers,
}: {
  testId: string;
  testTitle: string;
  attemptId: string;
  durationMin: number;
  remainingSec: number;
  questions: Q[];
  initialAnswers: { questionId: string; selectedOptionIds: string[]; textAnswer: string | null; codeAnswer: string | null }[];
}) {
  const router = useRouter();
  const { push } = useToast();

  const [remaining, setRemaining] = useState(remainingSec);
  const [active, setActive] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerDraft>>(() => {
    const map: Record<string, AnswerDraft> = {};
    for (const q of questions) {
      const saved = initialAnswers.find((a) => a.questionId === q.id);
      map[q.id] = saved
        ? { selectedOptionIds: saved.selectedOptionIds, textAnswer: saved.textAnswer ?? "", codeAnswer: saved.codeAnswer ?? "" }
        : emptyAnswer();
    }
    return map;
  });
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const dirtyRef = useRef<Record<string, AnswerDraft>>({});
  const submittedRef = useRef(false);

  const answeredCount = useMemo(
    () =>
      questions.filter((q) => {
        const a = answers[q.id];
        if (!a) return false;
        return a.selectedOptionIds.length > 0 || a.textAnswer.trim().length > 0 || a.codeAnswer.trim().length > 0;
      }).length,
    [answers, questions]
  );

  // ── Countdown ────────────────────────────────────────────────────────────
  const submit = useCallback(
    async (auto: boolean) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      try {
        const payload = {
          attemptId,
          answers: questions.map((q) => {
            const a = answers[q.id] ?? emptyAnswer();
            return {
              questionId: q.id,
              selectedOptionIds: a.selectedOptionIds,
              textAnswer: q.type === "SHORT_ANSWER" ? a.textAnswer : null,
              codeAnswer: q.type === "CODING" ? a.codeAnswer : null,
            };
          }),
        };
        const res = await fetch("/api/tests/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as { data?: { passed?: boolean }; error?: { message?: string } };
        if (!res.ok) {
          push(json.error?.message ?? "Submission failed — please retry.", "error");
          submittedRef.current = false;
          setSubmitting(false);
          return;
        }
        push(auto ? "Time is up — test submitted automatically." : "Test submitted! 🎉");
        router.replace(`/student/tests/${testId}`);
      } catch {
        push("Network error — please retry the submission.", "error");
        submittedRef.current = false;
        setSubmitting(false);
      }
    },
    [answers, attemptId, push, questions, router, testId]
  );

  useEffect(() => {
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t);
          void submit(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [submit]);

  // Warn before leaving with an unsubmitted attempt (no way to block reliably — this is a nicety)
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!submittedRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // ── Autosave (debounced per question) ────────────────────────────────────
  const saveAnswer = useCallback(
    async (questionId: string) => {
      const draft = dirtyRef.current[questionId];
      if (!draft) return;
      delete dirtyRef.current[questionId];
      setSaving(true);
      try {
        const q = questions.find((x) => x.id === questionId);
        const res = await fetch("/api/tests/autosave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptId,
            questionId,
            selectedOptionIds: draft.selectedOptionIds,
            textAnswer: q?.type === "SHORT_ANSWER" ? draft.textAnswer : null,
            codeAnswer: q?.type === "CODING" ? draft.codeAnswer : null,
          }),
        });
        if (res.status === 409) {
          // Attempt closed server-side (deadline passed) — reload to see the result.
          router.replace(`/student/tests/${testId}`);
        }
      } catch {
        // keep the draft dirty; it will retry on the next change
        dirtyRef.current[questionId] = draft;
      } finally {
        setSaving(false);
      }
    },
    [attemptId, questions, router, testId]
  );

  const markDirty = useCallback(
    (questionId: string, patch: Partial<AnswerDraft>) => {
      setAnswers((prev) => {
        const next = { ...prev[questionId], ...patch };
        dirtyRef.current[questionId] = next;
        return { ...prev, [questionId]: next };
      });
    },
    []
  );

  // Periodic flush of dirty answers (5s), plus flush on unmount/navigation
  useEffect(() => {
    const t = setInterval(() => {
      for (const qid of Object.keys(dirtyRef.current)) void saveAnswer(qid);
    }, 5000);
    return () => {
      clearInterval(t);
      for (const qid of Object.keys(dirtyRef.current)) void saveAnswer(qid);
    };
  }, [saveAnswer]);

  const q = questions[active];
  const a = q ? answers[q.id] ?? emptyAnswer() : emptyAnswer();
  const lowTime = remaining <= 60;

  function toggleOption(optionId: string) {
    if (!q) return;
    if (q.type === "MULTI_SELECT") {
      const set = new Set(a.selectedOptionIds);
      if (set.has(optionId)) set.delete(optionId);
      else set.add(optionId);
      markDirty(q.id, { selectedOptionIds: [...set] });
    } else {
      markDirty(q.id, { selectedOptionIds: [optionId] });
    }
  }

  if (!q) return null;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Test in progress</p>
          <h1 className="text-xl font-bold text-ink">{testTitle}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn("inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-sm font-bold tabular-nums ring-1 ring-inset", lowTime ? "animate-pulse bg-danger-50 text-danger-700 ring-danger-200" : "bg-slate-100 text-ink ring-slate-200")}>
            <Clock className="h-4 w-4" /> {fmtClock(remaining)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            {saving ? <><Save className="h-3.5 w-3.5 animate-pulse" /> Saving…</> : "All changes saved"}
          </span>
        </div>
      </div>

      <Progress value={answeredCount} max={questions.length} className="mb-4" />

      {/* Question nav */}
      <div className="scrollbar-none mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {questions.map((qq, i) => {
          const ans = answers[qq.id] ?? emptyAnswer();
          const isAnswered = ans.selectedOptionIds.length > 0 || ans.textAnswer.trim() || ans.codeAnswer.trim();
          return (
            <button
              key={qq.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Question ${i + 1}${isAnswered ? " (answered)" : " (unanswered)"}`}
              aria-current={i === active}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all",
                i === active
                  ? "bg-primary-600 text-white shadow-lift"
                  : isAnswered
                    ? "bg-success-100 text-success-700 hover:bg-success-200"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Question card */}
      <Card>
        <CardBody className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="primary">{TYPE_LABEL[q.type]}</Badge>
            <Badge tone="neutral">{q.marks} mark{q.marks === 1 ? "" : "s"}</Badge>
            <span className="text-xs text-slate-400">Question {active + 1} of {questions.length}</span>
          </div>
          <p className="text-base font-semibold leading-relaxed text-ink">{q.prompt}</p>

          {q.options.length > 0 ? (
            <div className="space-y-2" role="group" aria-label="Answer options">
              {q.options.map((opt) => {
                const selected = a.selectedOptionIds.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all",
                      selected
                        ? "border-primary-300 bg-primary-50 font-medium text-primary-900 ring-1 ring-inset ring-primary-200"
                        : "border-slate-200 hover:border-primary-200 hover:bg-slate-50"
                    )}
                  >
                    <input
                      type={q.type === "MULTI_SELECT" ? "checkbox" : "radio"}
                      name={`q-${q.id}`}
                      className="h-4 w-4 accent-primary-600"
                      checked={selected}
                      onChange={() => toggleOption(opt.id)}
                    />
                    {opt.text}
                  </label>
                );
              })}
            </div>
          ) : null}

          {q.type === "SHORT_ANSWER" ? (
            <div>
              <label htmlFor={`ta-${q.id}`} className="label-base">Your answer</label>
              <textarea
                id={`ta-${q.id}`}
                className="input-base min-h-[110px]"
                value={a.textAnswer}
                onChange={(e) => markDirty(q.id, { textAnswer: e.target.value })}
                onBlur={() => void saveAnswer(q.id)}
                placeholder="Type your answer…"
              />
            </div>
          ) : null}

          {q.type === "CODING" ? (
            <div>
              <label htmlFor={`code-${q.id}`} className="label-base">Your solution</label>
              <textarea
                id={`code-${q.id}`}
                spellCheck={false}
                className="code-editor min-h-[220px] w-full rounded-xl p-4 font-mono text-sm"
                value={a.codeAnswer}
                onChange={(e) => markDirty(q.id, { codeAnswer: e.target.value })}
                onBlur={() => void saveAnswer(q.id)}
                placeholder="// Write your solution here…"
              />
            </div>
          ) : null}

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <Button variant="outline" size="sm" onClick={() => setActive((i) => Math.max(0, i - 1))} disabled={active === 0}>
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            {active < questions.length - 1 ? (
              <Button size="sm" onClick={() => setActive((i) => Math.min(questions.length - 1, i + 1))}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="success" size="sm" onClick={() => setConfirmOpen(true)} disabled={submitting}>
                <Send className="h-4 w-4" /> Submit Test
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Submit bar */}
      <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft sm:flex-row">
        <p className="text-sm text-slate-500">
          <strong className="text-ink">{answeredCount}</strong> of {questions.length} answered
          {answeredCount < questions.length ? " — unanswered questions score zero." : " — you're ready to submit."}
        </p>
        <Button variant="success" onClick={() => setConfirmOpen(true)} disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Submit Test
        </Button>
      </div>

      {/* Confirm dialog */}
      {confirmOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Submit test">
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm animate-fade-in" onClick={() => setConfirmOpen(false)} />
          <div className="animate-scale-in relative w-full max-w-md rounded-2xl bg-white p-6 shadow-lift">
            <h3 className="text-lg font-bold text-ink">Submit your test?</h3>
            {answeredCount < questions.length ? (
              <div className="mt-3">
                <Alert tone="warning">
                  <span className="inline-flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" /> You have {questions.length - answeredCount} unanswered question{questions.length - answeredCount === 1 ? "" : "s"}.
                  </span>
                </Alert>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success-600" /> All questions answered.</span>
              </p>
            )}
            <p className="mt-2 text-sm text-slate-500">You can't change answers after submitting. Grading is instant for objective questions.</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Keep working</Button>
              <Button variant="success" onClick={() => void submit(false)} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit Test
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <p className="mt-4 text-center text-xs text-slate-400">
        Duration {durationMin} minutes · answers autosave on the server every few seconds
      </p>
    </div>
  );
}
