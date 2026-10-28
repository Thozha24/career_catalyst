"use client";

import { useState } from "react";
import { Play, Send, Loader2, CheckCircle2, XCircle, AlertTriangle, Trophy } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, Badge, Select } from "@/components/ui";
import { useToast } from "@/components/ui-client";

type RunResult = {
  verdict: string;
  passedCount: number;
  totalCount: number;
  runtimeMs: number;
  outputs: { passed: boolean; hidden: boolean }[];
};

type SubmitResult = RunResult & { pointsAwarded: number; achievements: string[] };

const LANG_LABEL: Record<string, string> = {
  javascript: "JavaScript",
  python: "Python 3",
  java: "Java",
  cpp: "C++",
};

export function CodeWorkspace({
  problemId,
  languages,
  starterCode,
}: {
  problemId: string;
  languages: string[];
  starterCode: Record<string, string>;
}) {
  const { push } = useToast();
  const [language, setLanguage] = useState(languages.includes("javascript") ? "javascript" : languages[0]);
  const [code, setCode] = useState(starterCode[languages.includes("javascript") ? "javascript" : languages[0]] ?? "");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<(RunResult & { pointsAwarded?: number }) | null>(null);

  function switchLanguage(next: string) {
    setLanguage(next);
    setCode(starterCode[next] ?? "");
    setResult(null);
  }

  function handleTab(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const { selectionStart: s, selectionEnd: en } = el;
      const next = code.slice(0, s) + "  " + code.slice(en);
      setCode(next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = s + 2;
      });
    }
  }

  async function post(path: string): Promise<{ ok: true; data: RunResult } | { ok: false; error: string }> {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId, language, code }),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json?.error?.message ?? "Something went wrong. Try again." };
    return { ok: true, data: json.data as RunResult };
  }

  async function onRun() {
    setRunning(true);
    setResult(null);
    try {
      const res = await post("/api/coding/run");
      if (!res.ok) {
        push(res.error, "error");
        return;
      }
      setResult(res.data);
    } catch {
      push("Network error — check your connection and try again.", "error");
    } finally {
      setRunning(false);
    }
  }

  async function onSubmit() {
    setSubmitting(true);
    setResult(null);
    try {
      const res = await post("/api/coding/submit");
      if (!res.ok) {
        push(res.error, "error");
        return;
      }
      const data = res.data as SubmitResult;
      setResult(data);
      if (data.verdict === "ACCEPTED") {
        push(data.pointsAwarded > 0 ? `Accepted! +${data.pointsAwarded} points 🎉` : "Accepted! ✅");
        if (data.achievements.length > 0) {
          setTimeout(() => push(`Achievement unlocked: ${data.achievements[0]} 🏆`, "info"), 700);
        }
      } else {
        push(`${data.passedCount}/${data.totalCount} test cases passed — keep going!`, "info");
      }
    } catch {
      push("Network error — check your connection and try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const accepted = result?.verdict === "ACCEPTED";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-ink shadow-lift">
      <div className="flex items-center justify-between gap-3 border-b border-slate-700/60 px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <span className="h-2.5 w-2.5 rounded-full bg-danger-400" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-warning-400" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-success-400" aria-hidden />
          <span className="ml-2">solution.{language === "cpp" ? "cpp" : language === "javascript" ? "js" : language === "java" ? "java" : "py"}</span>
        </div>
        <Select
          value={language}
          onChange={(e) => switchLanguage(e.target.value)}
          aria-label="Programming language"
          className="!w-auto !border-slate-600 !bg-slate-800 !py-1.5 !text-xs !text-slate-200"
        >
          {languages.map((l) => (
            <option key={l} value={l}>{LANG_LABEL[l] ?? l}</option>
          ))}
        </Select>
      </div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={handleTab}
        spellCheck={false}
        rows={16}
        aria-label="Code editor"
        className="code-editor block w-full bg-ink p-4"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-700/60 px-4 py-3">
        <p className="text-[11px] text-slate-500">Run uses the sample tests. Submit runs all tests (hidden ones included).</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRun} disabled={running || submitting} className="!border-slate-600 !bg-slate-800 !text-slate-200 hover:!bg-slate-700">
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Run
          </Button>
          <Button size="sm" onClick={onSubmit} disabled={running || submitting || code.trim().length === 0}>
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Submit
          </Button>
        </div>
      </div>

      {result ? (
        <div className={cn("border-t px-4 py-4", accepted ? "border-success-700/40 bg-success-950/40" : "border-slate-700/60 bg-slate-900/60")} aria-live="polite">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone={accepted ? "success" : result.verdict === "TIMEOUT" ? "warning" : "danger"}>
              {accepted ? <CheckCircle2 className="h-3.5 w-3.5" /> : result.verdict === "TIMEOUT" ? <AlertTriangle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {result.verdict.replaceAll("_", " ")}
            </Badge>
            <span className="text-xs text-slate-400">{result.passedCount}/{result.totalCount} tests · {result.runtimeMs}ms</span>
            {result.pointsAwarded ? (
              <Badge tone="warning"><Trophy className="h-3.5 w-3.5" /> +{result.pointsAwarded} pts</Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {result.outputs.map((o, i) => (
              <span
                key={i}
                title={o.hidden ? "Hidden test" : "Sample test"}
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold",
                  o.passed ? "bg-success-600/20 text-success-400" : "bg-danger-600/20 text-danger-400"
                )}
              >
                {o.passed ? "✓" : "✗"}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
