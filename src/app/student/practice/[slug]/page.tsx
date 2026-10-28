import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, History } from "lucide-react";
import { requireStudent } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { renderMarkdown } from "@/lib/markdown";
import { Card, CardBody, Badge } from "@/components/ui";
import { CodeWorkspace } from "./code-workspace";
import { difficultyTone, formatRelative } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireStudent();

  const problem = await prisma.codingProblem.findUnique({ where: { slug } });
  if (!problem) notFound();

  const submissions = await prisma.codingSubmission.findMany({
    where: { userId: user.id, problemId: problem.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, language: true, verdict: true, passedCount: true, totalCount: true, pointsAwarded: true, createdAt: true },
  });

  const solved = submissions.some((s) => s.verdict === "ACCEPTED");

  let starter: Record<string, string> = {};
  try {
    starter = JSON.parse(problem.starterCode);
  } catch {
    starter = {};
  }

  const publicCases = (() => {
    try {
      return (JSON.parse(problem.testCases) as { input: string; expectedOutput: string; hidden?: boolean }[]).filter((tc) => !tc.hidden);
    } catch {
      return [];
    }
  })();

  return (
    <>
      <Link href="/student/practice" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-600">
        <ChevronLeft className="h-4 w-4" /> Back to problems
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Statement */}
        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={difficultyTone(problem.difficulty)}>{problem.difficulty.charAt(0) + problem.difficulty.slice(1).toLowerCase()}</Badge>
              <Badge tone="neutral">{problem.category}</Badge>
              <Badge tone={solved ? "success" : "primary"}>{solved ? "✓ Solved" : `+${problem.pointsAward} pts`}</Badge>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-ink">{problem.title}</h1>
          </div>
          <Card>
            <CardBody>
              <div className="prose-cc">{renderMarkdown(problem.description)}</div>
              <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 text-sm">
                {problem.inputFormat ? (
                  <p><strong className="text-ink">Input:</strong> <span className="text-slate-600">{problem.inputFormat}</span></p>
                ) : null}
                {problem.outputFormat ? (
                  <p><strong className="text-ink">Output:</strong> <span className="text-slate-600">{problem.outputFormat}</span></p>
                ) : null}
                {problem.constraints ? (
                  <p><strong className="text-ink">Constraints:</strong> <span className="text-slate-600">{problem.constraints}</span></p>
                ) : null}
              </div>
            </CardBody>
          </Card>

          {publicCases.length > 0 ? (
            <Card>
              <CardBody>
                <h3 className="mb-3 text-sm font-bold text-ink">Sample test cases</h3>
                <div className="space-y-3">
                  {publicCases.map((tc, i) => (
                    <div key={i} className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-100">
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">Input</p>
                        <pre className="whitespace-pre-wrap font-mono text-xs text-slate-700">{tc.input}</pre>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-100">
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">Expected output</p>
                        <pre className="whitespace-pre-wrap font-mono text-xs text-slate-700">{tc.expectedOutput}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          ) : null}

          {submissions.length > 0 ? (
            <Card>
              <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3 text-sm font-bold text-ink">
                <History className="h-4 w-4 text-slate-400" /> Submission history
              </div>
              <ul className="divide-y divide-slate-100 text-sm">
                {submissions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between px-5 py-2.5">
                    <span className="text-xs text-slate-400">{formatRelative(s.createdAt)} · {s.language}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{s.passedCount}/{s.totalCount} tests</span>
                      <Badge tone={s.verdict === "ACCEPTED" ? "success" : s.verdict === "PENDING" ? "neutral" : "danger"}>{s.verdict.replaceAll("_", " ")}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>

        {/* Editor */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <CodeWorkspace problemId={problem.id} languages={["javascript", "python", "java", "cpp"]} starterCode={starter} />
        </div>
      </div>
    </>
  );
}
