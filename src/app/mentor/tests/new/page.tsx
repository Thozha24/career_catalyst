import { Users } from "lucide-react";
import { requireMentor } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ButtonLink } from "@/components/ui";
import { TestBuilder } from "./test-builder";

export const dynamic = "force-dynamic";

export default async function NewTestPage() {
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
        title="Create Test"
        description="Build a timed test: questions are auto-graded server-side; short answers and code go to manual grading."
      />
      {groups.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Create a group first"
          description="Tests are assigned to groups. Create a group, invite students, then build tests."
          action={<ButtonLink href="/mentor/groups">Go to groups</ButtonLink>}
        />
      ) : (
        <TestBuilder groups={groups} />
      )}
    </>
  );
}
