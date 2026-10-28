import Link from "next/link";
import { Users, Plus, KeyRound, ArrowRight, ClipboardList, ListChecks } from "lucide-react";
import { requireMentor } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody, Badge, ButtonLink, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { CreateGroupForm } from "./create-group-form";

export const dynamic = "force-dynamic";

export default async function MentorGroupsPage() {
  const user = await requireMentor();

  const groups = await prisma.group.findMany({
    where: { mentorId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { members: { where: { isActive: true } }, tasks: true, tests: true } },
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="Mentorship"
        title="My Groups"
        description="Create groups, share invite codes, and manage your cohorts."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {groups.length === 0 ? (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="No groups yet"
              description="Create your first group — students join with the invite code you share."
            />
          ) : (
            groups.map((g) => (
              <Link key={g.id} href={`/mentor/groups/${g.id}`} className="block">
                <Card className="card-hover transition-all hover:border-primary-200">
                  <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-ink">{g.name}</h3>
                        {!g.isActive ? <Badge tone="neutral">Inactive</Badge> : null}
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-slate-500">{g.description ?? "No description"}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span>{g._count.members} students</span>
                        <span className="inline-flex items-center gap-1"><ListChecks className="h-3.5 w-3.5" /> {g._count.tasks} tasks</span>
                        <span className="inline-flex items-center gap-1"><ClipboardList className="h-3.5 w-3.5" /> {g._count.tests} tests</span>
                        <span>Created {formatDate(g.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs text-slate-600">
                        <KeyRound className="h-3.5 w-3.5" /> {g.inviteCode}
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-300" />
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))
          )}
        </div>

        <div>
          <Card>
            <CardHeader title="Create a group" subtitle="An invite code is generated automatically" icon={<Plus className="h-4 w-4" />} />
            <CardBody>
              <CreateGroupForm />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
