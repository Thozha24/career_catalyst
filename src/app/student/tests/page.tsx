import Link from "next/link";
import { ClipboardList, CalendarClock, Timer } from "lucide-react";
import { requireStudent } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, Badge, ButtonLink, EmptyState } from "@/components/ui";
import { formatDateTime, formatRelative } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function StudentTestsPage() {
  const user = await requireStudent();
  const now = new Date();

  const memberships = await prisma.groupMember.findMany({
    where: { studentId: user.id, isActive: true },
    select: { groupId: true },
  });
  const groupIds = memberships.map((m) => m.groupId);

  const tests = groupIds.length
    ? await prisma.test.findMany({
        where: { groupId: { in: groupIds }, isActive: true },
        orderBy: { createdAt: "desc" },
        include: {
          group: { select: { name: true } },
          attempts: { where: { studentId: user.id }, orderBy: { startedAt: "desc" } },
          _count: { select: { questions: true } },
        },
      })
    : [];

  const open = tests.filter((t) => (!t.availableFrom || now >= t.availableFrom) && (!t.availableUntil || now <= t.availableUntil));
  const closed = tests.filter((t) => t.availableUntil && now > t.availableUntil);

  const statusFor = (t: (typeof tests)[number]) => {
    const inProgress = t.attempts.find((a) => a.status === "IN_PROGRESS");
    const submitted = t.attempts.find((a) => a.status === "SUBMITTED");
    if (submitted) return "SUBMITTED" as const;
    if (inProgress) return "IN_PROGRESS" as const;
    return "NOT_STARTED" as const;
  };

  return (
    <>
      <PageHeader
        eyebrow="Assessments"
        title="Tests"
        description="Timed tests assigned by your mentor. Answers autosave — if you disconnect, resume where you left off."
      />

      {tests.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title="No tests yet"
          description="Tests assigned to your group will appear here. Join a mentor group to receive assessments."
          action={<ButtonLink href="/student/group">Join a Group</ButtonLink>}
        />
      ) : (
        <div className="space-y-3">
          {[...open, ...closed].map((t) => {
            const status = statusFor(t);
            const latest = t.attempts[0];
            const isClosed = closed.includes(t);
            const window = `${formatDateTime(t.availableFrom)} — ${formatDateTime(t.availableUntil)}`;
            return (
              <Card key={t.id} className="card-hover">
                <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-ink">{t.title}</h3>
                      {status === "SUBMITTED" ? (
                        <Badge tone={latest?.passed ? "success" : "danger"}>{latest?.percentage}% · {latest?.passed ? "Passed" : "Not passed"}</Badge>
                      ) : status === "IN_PROGRESS" ? (
                        <Badge tone="warning">In progress</Badge>
                      ) : isClosed ? (
                        <Badge tone="neutral">Closed</Badge>
                      ) : (
                        <Badge tone="primary">Open</Badge>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm text-slate-500">{t.description ?? "No description"}</p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1"><Timer className="h-3.5 w-3.5" /> {t.durationMin} min</span>
                      <span>{t._count.questions} questions</span>
                      <span>Pass: {t.passingScore}%</span>
                      <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> {t.availableFrom || t.availableUntil ? window : "Always available"}</span>
                      <span>{t.group.name}</span>
                    </p>
                  </div>
                  <div className="shrink-0">
                    {status === "SUBMITTED" ? (
                      <ButtonLink href={`/student/tests/${t.id}`} variant="outline">View results</ButtonLink>
                    ) : status === "IN_PROGRESS" ? (
                      <ButtonLink href={`/student/tests/${t.id}/take`} variant="warning">Resume test</ButtonLink>
                    ) : isClosed ? (
                      <ButtonLink href={`/student/tests/${t.id}`} variant="outline">Details</ButtonLink>
                    ) : (
                      <ButtonLink href={`/student/tests/${t.id}`}>Take Test</ButtonLink>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
      <p className="mt-4 text-xs text-slate-400">Scores are calculated on the server. Last sync {formatRelative(now)}.</p>
      <Link href="/student/dashboard" className="sr-only">Dashboard</Link>
    </>
  );
}
