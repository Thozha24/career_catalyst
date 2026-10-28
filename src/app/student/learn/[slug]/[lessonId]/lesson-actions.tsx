"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, PlayCircle, HelpCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, Card, CardBody, Progress } from "@/components/ui";
import { useToast } from "@/components/ui-client";
import { completeLessonAction, submitQuizAction } from "@/app/actions/learning";

type QuizQ = { question: string; options: string[] };

export function LessonActions({
  lessonId,
  quiz,
  alreadyCompleted,
  nextHref,
}: {
  lessonId: string;
  quiz: QuizQ[];
  alreadyCompleted: boolean;
  nextHref: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [completed, setCompleted] = useState(alreadyCompleted);
  const [answers, setAnswers] = useState<number[]>(quiz.map(() => -1));
  const [graded, setGraded] = useState<boolean[] | null>(null);
  const [key, setKey] = useState<number[]>([]);
  const [pending, startTransition] = useTransition();

  const answeredCount = answers.filter((a) => a >= 0).length;
  const allAnswered = quiz.length === 0 || answeredCount === quiz.length;

  function onComplete() {
    startTransition(async () => {
      const res = await completeLessonAction(lessonId);
      if (!res.ok) {
        push(res.error ?? "Could not complete the lesson.", "error");
        return;
      }
      setCompleted(true);
      if (res.pointsAwarded && res.pointsAwarded > 0) {
        push(`Lesson complete! +${res.pointsAwarded} points 🎉`);
      } else {
        push("Lesson progress saved");
      }
      if (res.achievements && res.achievements.length > 0) {
        setTimeout(() => push(`Achievement unlocked: ${res.achievements![0]} 🏆`, "info"), 600);
      }
      router.refresh();
    });
  }

  function gradeQuiz() {
    startTransition(async () => {
      const res = await submitQuizAction(lessonId, answers);
      if (!res.ok) {
        push(res.error ?? "Could not grade the quiz.", "error");
        return;
      }
      setGraded(res.results);
      setKey(res.correctIndices);
      if (res.results.length > 0 && res.results.every(Boolean)) {
        push("Perfect quiz score! ✨");
      } else if (res.results.length > 0) {
        push("Review the highlighted answers and try again.", "info");
      }
    });
  }

  return (
    <div className="mt-6 space-y-6">
      {quiz.length > 0 ? (
        <Card>
          <CardBody>
            <h3 className="mb-1 flex items-center gap-2 text-base font-bold text-ink">
              <HelpCircle className="h-4 w-4 text-primary-600" /> Knowledge check
            </h3>
            <p className="mb-4 text-xs text-slate-400">Graded on the server — answers are checked against the stored key.</p>
            <div className="mb-4">
              <Progress value={answeredCount} max={quiz.length} />
              <p className="mt-1 text-xs text-slate-400">{answeredCount}/{quiz.length} answered</p>
            </div>
            <div className="space-y-5">
              {quiz.map((q, qi) => (
                <fieldset key={qi} className="rounded-xl border border-slate-100 p-4">
                  <legend className="px-1 text-sm font-semibold text-ink">{qi + 1}. {q.question}</legend>
                  <div className="mt-2 space-y-1.5">
                    {q.options.map((opt, oi) => {
                      const selected = answers[qi] === oi;
                      const isCorrect = key[qi] === oi;
                      const showState = graded !== null;
                      return (
                        <label
                          key={oi}
                          className={cn(
                            "flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                            showState && isCorrect && "bg-success-50 text-success-800 ring-1 ring-inset ring-success-200",
                            showState && selected && !isCorrect && "bg-danger-50 text-danger-800 ring-1 ring-inset ring-danger-200",
                            !showState && selected && "bg-primary-50 text-primary-800 ring-1 ring-inset ring-primary-200",
                            !showState && !selected && "hover:bg-slate-50",
                            showState && !isCorrect && !selected && "opacity-60"
                          )}
                        >
                          <input
                            type="radio"
                            name={`quiz-${lessonId}-${qi}`}
                            className="h-4 w-4 accent-primary-600"
                            checked={selected}
                            disabled={graded !== null || pending}
                            onChange={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                          />
                          {opt}
                        </label>
                      );
                    })}
                  </div>
                  {graded !== null && !graded[qi] && key[qi] !== undefined ? (
                    <p className="mt-2 text-xs font-medium text-success-700">Correct answer: {q.options[key[qi]]}</p>
                  ) : null}
                </fieldset>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              {graded === null ? (
                <Button onClick={gradeQuiz} disabled={!allAnswered || pending}>
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Check answers
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setGraded(null);
                    setKey([]);
                    setAnswers(quiz.map(() => -1));
                  }}
                >
                  Retry quiz
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {completed ? (
          <>
            <span className="inline-flex items-center gap-2 rounded-xl bg-success-50 px-4 py-2.5 text-sm font-semibold text-success-700 ring-1 ring-inset ring-success-100">
              <CheckCircle2 className="h-4 w-4" /> Lesson completed
            </span>
            <Button variant="primary" onClick={() => (window.location.href = nextHref)}>
              Next lesson <PlayCircle className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button onClick={onComplete} disabled={pending} size="lg" className="btn-shine">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Mark as complete (+points)
          </Button>
        )}
      </div>
    </div>
  );
}
