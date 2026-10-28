import Link from "next/link";
import { ClipboardList, Plus, Users, Target, CalendarClock, FileCheck2 } from "lucide-react";
import { requireMentor } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, Badge, ButtonLink, EmptyState } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MentorTestsPage() {
  const user = await requireMentor();

  const tests = await prisma.test.findMany({
    where: { createdBy: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      group: { select: { id: true, name: true, _count: { select: { members: { where: { isActive: true } } } } } },
      _count: { select: { questions: true, attempts: { where: { status: "SUBMITTED" } } } },
    },
  });

  const needGrading = tests.reduce((s, t) => s + t._count.attempts, 0) > 0;

  return (
    <>
      <PageHeader
        eyebrow="Teaching"
        title="Tests"
        description="Create timed assessments for your groups — auto-graded instantly, manual marks for short answers and code."
        action={
          <ButtonLink href="/mentor/tests/new">
            <Plus className="h-4 w-4" /> Create Test
          </ButtonLink>
        }
      />

      {tests.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title="No tests yet"
          description="Build your first test: multiple choice, multi-select, true/false, short answer or coding questions."
          action={<ButtonLink href="/mentor/tests/new">Create your first test</ButtonLink>}
        />
      ) : (
        <div className="space-y-3">
          {tests.map((t) => {
            const windowLabel = t.availableFrom || t.availableUntil
              ? `${formatDateTime(t.availableFrom)} — ${formatDateTime(t.availableUntil)}`
              : "Always available";
            const participation = t.group._count.members > 0 ? Math.round((t._count.attempts / t.group._count.members) * 100) : 0;
            return (
              <Link key={t.id} href={`/mentor/tests/${t.id}`} className="block">
                <Card className="card-hover transition-all hover:border-primary-200">
                  <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-ink">{t.title}</h3>
                        {!t.isActive ? <Badge tone="neutral">Archived</Badge> : null}
                        {t.negativeMarking ? <Badge tone="danger">Negative marking</Badge> : null}
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-slate-500">{t.description ?? "No description"}</p>
                      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {t.group.name}</span>
                        <span>{t._count.questions} questions</span>
                        <span className="inline-flex items-center gap-1"><FileCheck2 className="h-3.5 w-3.5" /> {t._count.attempts}/{t.group._count.members} submitted ({participation}%)</span>
                        <span className="inline-flex items-center gap-1"><Target className="h-3.5 w-3.5" /> Pass {t.passingScore}%</span>
                        <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> {windowLabel}</span>
                      </p>
                    </div>
                    <Badge tone={t._count.attempts === 0 ? "neutral" : "primary"} className="shrink-0">
                      {t._count.attempts} attempt{t._count.attempts === 1 ? "" : "s"}
                    </Badge>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
      {needGrading ? (
        <p className="mt-4 text-xs text-slate-400">Tip: open a test to review results and manually grade short-answer & coding questions.</p>
      ) : null}
    </>
  );
}
