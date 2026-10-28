import { Megaphone } from "lucide-react";
import { requireMentor } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody, Badge, EmptyState, ButtonLink } from "@/components/ui";
import { formatRelative } from "@/lib/format";
import { AnnouncementForm } from "./announcement-form";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ groupId?: string }> };

export default async function MentorAnnouncementsPage({ searchParams }: Props) {
  const { groupId } = await searchParams;
  const user = await requireMentor();

  const groups = await prisma.group.findMany({
    where: { mentorId: user.id, isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, _count: { select: { members: { where: { isActive: true } } } } },
  });

  const announcements = await prisma.announcement.findMany({
    where: { group: { mentorId: user.id } },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { group: { select: { name: true } } },
  });

  return (
    <>
      <PageHeader
        eyebrow="Teaching"
        title="Announcements"
        description="Broadcast updates to a group — every member gets a notification instantly."
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="h-6 w-6" />}
          title="No groups yet"
          description="Create a group before posting announcements."
          action={<ButtonLink href="/mentor/groups">Go to groups</ButtonLink>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div>
            <Card>
              <CardHeader title="New announcement" icon={<Megaphone className="h-4 w-4" />} />
              <CardBody>
                <AnnouncementForm groups={groups} defaultGroupId={groupId ?? groups[0]?.id} />
              </CardBody>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Recent ({announcements.length})</h2>
            {announcements.length === 0 ? (
              <EmptyState icon={<Megaphone className="h-6 w-6" />} title="No announcements yet" description="Post your first update using the form." />
            ) : (
              <div className="space-y-3">
                {announcements.map((a) => (
                  <Card key={a.id}>
                    <CardBody>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold text-ink">{a.title}</p>
                        <Badge tone="primary">{a.group.name}</Badge>
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-600">{a.body}</p>
                      <p className="mt-2 text-xs text-slate-400">{formatRelative(a.createdAt)} · delivered to {a.group.name} members</p>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
