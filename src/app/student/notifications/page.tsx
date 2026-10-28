import { Bell } from "lucide-react";
import { requireStudent } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Badge, EmptyState } from "@/components/ui";
import { formatRelative } from "@/lib/format";
import { NotificationList } from "@/components/notification-list";

export const dynamic = "force-dynamic";

export default async function StudentNotificationsPage() {
  const user = await requireStudent();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Notifications"
        description="Test assignments, task updates, feedback, achievements and announcements."
        action={
          unread > 0 ? <Badge tone="danger">{unread} unread</Badge> : <Badge tone="success">All read</Badge>
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-6 w-6" />}
          title="No notifications yet"
          description="We'll let you know when mentors assign tests or tasks, leave feedback, or you unlock achievements."
        />
      ) : (
        <NotificationList items={notifications.map((n) => ({ id: n.id, type: n.type, title: n.title, body: n.body, link: n.link, isRead: n.isRead, createdAt: n.createdAt.toISOString() }))} />
      )}
    </>
  );
}
