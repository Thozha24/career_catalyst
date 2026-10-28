import { Users } from "lucide-react";
import { requireMentor } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ButtonLink } from "@/components/ui";
import { TaskBuilder } from "./task-builder";

export const dynamic = "force-dynamic";

export default async function NewTaskPage() {
  const user = await requireMentor();

  const groups = await prisma.group.findMany({
    where: { mentorId: user.id, isActive: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  return (
    <>
      <PageHeader
        eyebrow="Teaching"
        title="Create Task"
        description="Everyone in the group receives the task and a notification immediately."
      />
      {groups.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Create a group first"
          description="Tasks are assigned to groups."
          action={<ButtonLink href="/mentor/groups">Go to groups</ButtonLink>}
        />
      ) : (
        <TaskBuilder groups={groups} />
      )}
    </>
  );
}
