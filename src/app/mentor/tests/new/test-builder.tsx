"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, GripVertical, Save, CheckSquare, ListTree, ToggleLeft,
  AlignLeft, Code2, Loader2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Alert, Badge, Button, Card, CardBody, Input, Label, Select, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui-client";
import { createTestAction } from "@/app/actions/tests";

type QType = "MCQ" | "MULTI_SELECT" | "TRUE_FALSE" | "SHORT_ANSWER" | "CODING";

type DraftOption = { text: string; isCorrect: boolean };

type DraftQuestion = {
  type: QType;
  prompt: string;
  marks: number;
  negativeMarks: number;
  explanation: string;
  options: DraftOption[];
};

const TYPE_META: Record<QType, { label: string; icon: React.ReactNode; desc: string }> = {
  MCQ: { label: "Multiple choice", icon: <CheckSquare className="h-4 w-4" />, desc: "One correct option" },
  MULTI_SELECT: { label: "Multiple select", icon: <ListTree className="h-4 w-4" />, desc: "Two or more correct options" },
  TRUE_FALSE: { label: "True / false", icon: <ToggleLeft className="h-4 w-4" />, desc: "Exactly one correct statement" },
  SHORT_ANSWER: { label: "Short answer", icon: <AlignLeft className="h-4 w-4" />, desc: "Mentor-graded, can preload a model answer" },
  CODING: { label: "Coding", icon: <Code2 className="h-4 w-4" />, desc: "Mentor-graded code answer" },
};

function emptyQuestion(): DraftQuestion {
  return {
    type: "MCQ",
    prompt: "",
    marks: 1,
    negativeMarks: 0,
    explanation: "",
    options: [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
  };
}

export function TestBuilder({ groups }: { groups: { id: string; name: string }[] }) {
  const router = useRouter();
  const { push } = useToast();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [durationMin, setDurationMin] = useState("30");
  const [passingScore, setPassingScore] = useState("50");
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);
  const [error, setError] = useState<string | null>(null);

  function updateQuestion(idx: number, patch: Partial<DraftQuestion>) {
    setQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  }

  function changeType(idx: number, type: QType) {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== idx) return q;
        if (type === "TRUE_FALSE") {
          return { ...q, type, options: [{ text: "True", isCorrect: true }, { text: "False", isCorrect: false }] };
        }
        if (type === "SHORT_ANSWER") {
          return { ...q, type, options: [{ text: "", isCorrect: true }] };
        }
        if (type === "CODING") {
          return { ...q, type, options: [] };
        }
        if (q.type === "TRUE_FALSE" || q.type === "SHORT_ANSWER" || q.type === "CODING") {
          return { ...q, type, options: [{ text: "", isCorrect: true }, { text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }] };
        }
        return { ...q, type };
      })
    );
  }

  function updateOption(qi: number, oi: number, patch: Partial<DraftOption>) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? { ...o, ...patch } : o)) } : q
      )
    );
  }

  function setSingleCorrect(qi: number, oi: number) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qi ? { ...q, options: q.options.map((o, j) => ({ ...o, isCorrect: j === oi })) } : q
      )
    );
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const payload = {
        title,
        description: description || undefined,
        groupId,
        durationMin: Number(durationMin),
        passingScore: Number(passingScore),
        negativeMarking,
        availableFrom: availableFrom ? new Date(availableFrom).toISOString() : undefined,
        availableUntil: availableUntil ? new Date(availableUntil).toISOString() : undefined,
        questions: questions.map((q) => ({
          type: q.type,
          prompt: q.prompt,
          marks: Number(q.marks) || 1,
          negativeMarks: Number(q.negativeMarks) || 0,
          explanation: q.explanation || undefined,
          options:
            q.type === "CODING"
              ? []
              : q.type === "SHORT_ANSWER"
                ? [q.options[0]].filter((o) => o && o.text.trim())
                : q.options.filter((o) => o.text.trim()),
        })),
      };
      const res = await createTestAction(payload);
      if (!res.ok) {
        setError(res.error ?? "Could not create the test.");
        return;
      }
      push("Test created and assigned 🎉");
      router.push(`/mentor/tests/${res.id}`);
    });
  }

  return (
    <div className="space-y-6">
      {error ? <Alert tone="danger">{error}</Alert> : null}

      {/* Basics */}
      <Card>
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="title">Test title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. JavaScript Fundamentals — Week 3" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="description" hint="optional">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this test cover?" className="min-h-[70px]" />
            </div>
            <div>
              <Label htmlFor="groupId">Assign to group</Label>
              <Select id="groupId" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="durationMin">Duration (minutes)</Label>
              <Input id="durationMin" type="number" min={5} max={300} value={durationMin} onChange={(e) => setDurationMin(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="passingScore">Passing score (%)</Label>
              <Input id="passingScore" type="number" min={0} max={100} value={passingScore} onChange={(e) => setPassingScore(e.target.value)} />
            </div>
            <div>
              <Label>Negative marking</Label>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                <input type="checkbox" className="h-4 w-4 accent-primary-600" checked={negativeMarking} onChange={(e) => setNegativeMarking(e.target.checked)} />
                Deduct marks for wrong answers
              </label>
            </div>
            <div>
              <Label htmlFor="availableFrom" hint="optional">Available from</Label>
              <Input id="availableFrom" type="datetime-local" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="availableUntil" hint="optional">Available until</Label>
              <Input id="availableUntil" type="datetime-local" value={availableUntil} onChange={(e) => setAvailableUntil(e.target.value)} />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, qi) => (
          <Card key={qi}>
            <CardBody className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge tone="primary">Question {qi + 1}</Badge>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-danger-600 hover:bg-danger-50 disabled:opacity-40"
                  onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== qi))}
                  disabled={questions.length === 1}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>

              <div>
                <Label htmlFor={`prompt-${qi}`}>Question text</Label>
                <Textarea
                  id={`prompt-${qi}`}
                  value={q.prompt}
                  onChange={(e) => updateQuestion(qi, { prompt: e.target.value })}
                  placeholder="Type the question…"
                  className="min-h-[64px]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor={`type-${qi}`}>Type</Label>
                  <Select id={`type-${qi}`} value={q.type} onChange={(e) => changeType(qi, e.target.value as QType)}>
                    {Object.entries(TYPE_META).map(([val, meta]) => (
                      <option key={val} value={val}>{meta.label}</option>
                    ))}
                  </Select>
                  <p className="mt-1 text-xs text-slate-400">{TYPE_META[q.type].desc}</p>
                </div>
                <div>
                  <Label htmlFor={`marks-${qi}`}>Marks</Label>
                  <Input id={`marks-${qi}`} type="number" min={1} max={100} value={q.marks} onChange={(e) => updateQuestion(qi, { marks: Number(e.target.value) })} />
                </div>
                <div>
                  <Label htmlFor={`neg-${qi}`}>Negative marks</Label>
                  <Input id={`neg-${qi}`} type="number" min={0} max={100} value={q.negativeMarks} onChange={(e) => updateQuestion(qi, { negativeMarks: Number(e.target.value) })} disabled={!negativeMarking} />
                </div>
              </div>

              {q.type !== "CODING" ? (
                <div>
                  <Label>Options {q.type === "SHORT_ANSWER" ? "(model answer used for auto-match, mentor can override)" : "(tick the correct ones)"}</Label>
                  <div className="mt-1.5 space-y-2">
                    {q.options.map((o, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          type={q.type === "MULTI_SELECT" ? "checkbox" : "radio"}
                          name={`correct-${qi}`}
                          className="h-4 w-4 shrink-0 accent-primary-600"
                          checked={o.isCorrect}
                          onChange={() => (q.type === "MULTI_SELECT" ? updateOption(qi, oi, { isCorrect: !o.isCorrect }) : setSingleCorrect(qi, oi))}
                          aria-label={`Mark option ${oi + 1} correct`}
                        />
                        <Input
                          value={o.text}
                          onChange={(e) => updateOption(qi, oi, { text: e.target.value })}
                          placeholder={q.type === "SHORT_ANSWER" ? "Expected answer (normalized match)" : `Option ${oi + 1}`}
                        />
                        {q.type !== "TRUE_FALSE" && q.type !== "SHORT_ANSWER" && q.options.length > 2 ? (
                          <button
                            type="button"
                            className="rounded-lg p-2 text-slate-300 hover:bg-danger-50 hover:text-danger-500"
                            onClick={() =>
                              setQuestions((qs) => qs.map((qq, i) => (i === qi ? { ...qq, options: qq.options.filter((_, j) => j !== oi) } : qq)))
                            }
                            aria-label={`Remove option ${oi + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  {q.type !== "TRUE_FALSE" && q.type !== "SHORT_ANSWER" && q.options.length < 10 ? (
                    <button
                      type="button"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
                      onClick={() => updateQuestion(qi, { options: [...q.options, { text: "", isCorrect: false }] })}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add option
                    </button>
                  ) : null}
                </div>
              ) : (
                <Alert tone="info">
                  Coding questions are answered in a code editor and graded manually. Students see a plain code box.
                </Alert>
              )}

              <div>
                <Label htmlFor={`expl-${qi}`} hint="optional">Explanation</Label>
                <Input id={`expl-${qi}`} value={q.explanation} onChange={(e) => updateQuestion(qi, { explanation: e.target.value })} placeholder="Shown after grading (optional)" />
              </div>
            </CardBody>
          </Card>
        ))}

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 px-4 py-4 text-sm font-semibold text-slate-500 transition-colors hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-700"
          onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])}
        >
          <Plus className="h-4 w-4" /> Add question
        </button>
      </div>

      {/* Summary + submit */}
      <Card className="sticky bottom-4">
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Badge tone="primary">{questions.length} questions</Badge>
            <Badge tone="warning">{questions.reduce((s, q) => s + (Number(q.marks) || 0), 0)} marks total</Badge>
            <span className="hidden sm:inline">to <strong className="text-ink">{groups.find((g) => g.id === groupId)?.name}</strong></span>
          </div>
          <Button size="lg" onClick={submit} disabled={pending || !title.trim() || !groupId}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {pending ? "Creating…" : "Create & assign test"}
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
