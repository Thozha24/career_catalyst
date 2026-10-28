import Link from "next/link";
import { Code2, CheckCircle2, Search } from "lucide-react";
import { requireStudent } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Badge, EmptyState, Input, Card } from "@/components/ui";
import { difficultyTone } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PracticePage({ searchParams }: { searchParams: Promise<{ q?: string; difficulty?: string }> }) {
  const user = await requireStudent();
  const { q, difficulty } = await searchParams;

  const problems = await prisma.codingProblem.findMany({
    where: {
      AND: [
        q ? { OR: [{ title: { contains: q } }, { category: { contains: q } }] } : {},
        difficulty && difficulty !== "ALL" ? { difficulty } : {},
      ],
    },
    orderBy: { order: "asc" },
  });

  const solved = await prisma.codingSubmission.findMany({
    where: { userId: user.id, verdict: "ACCEPTED" },
    select: { problemId: true },
    distinct: ["problemId"],
  });
  const solvedSet = new Set(solved.map((s) => s.problemId));

  const difficulties = ["ALL", "EASY", "MEDIUM", "HARD"];

  return (
    <>
      <PageHeader
        eyebrow="Coding Practice"
        title="Coding Arena"
        description={`${solvedSet.size} of ${problems.length} problems solved. Read the problem, write your solution and run it against the test cases.`}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form className="relative w-full sm:max-w-sm" action="/student/practice">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <Input name="q" defaultValue={q} placeholder="Search problems…" className="pl-9" aria-label="Search problems" />
        </form>
        <div className="flex gap-1.5" role="group" aria-label="Filter by difficulty">
          {difficulties.map((d) => (
            <Link
              key={d}
              href={`/student/practice?${new URLSearchParams({ ...(q ? { q } : {}), ...(d !== "ALL" ? { difficulty: d } : {}) })}`}
              className={
                (difficulty ?? "ALL") === d
                  ? "rounded-lg bg-primary-600 px-3.5 py-1.5 text-xs font-bold text-white"
                  : "rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-primary-50 hover:text-primary-700"
              }
            >
              {d === "ALL" ? "All" : d.charAt(0) + d.slice(1).toLowerCase()}
            </Link>
          ))}
        </div>
      </div>

      {problems.length === 0 ? (
        <EmptyState icon={<Code2 className="h-6 w-6" />} title="No problems match" description="Try a different search or difficulty filter." />
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100">
            {problems.map((p, i) => (
              <li key={p.id}>
                <Link href={`/student/practice/${p.slug}`} className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-primary-50/50 sm:px-5">
                  <span className="w-6 text-sm text-slate-400">{i + 1}.</span>
                  <CheckCircle2
                    className={`h-5 w-5 shrink-0 ${solvedSet.has(p.id) ? "text-success-600" : "text-slate-200 group-hover:text-slate-300"}`}
                    aria-label={solvedSet.has(p.id) ? "Solved" : "Unsolved"}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink group-hover:text-primary-700">{p.title}</p>
                    <p className="text-xs text-slate-400">{p.category}</p>
                  </div>
                  <span className="hidden text-xs text-slate-400 sm:block">+{p.pointsAward} pts</span>
                  <Badge tone={difficultyTone(p.difficulty)}>{p.difficulty.charAt(0) + p.difficulty.slice(1).toLowerCase()}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
