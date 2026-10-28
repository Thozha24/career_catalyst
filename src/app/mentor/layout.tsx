import type { ReactNode } from "react";
import {
  LayoutDashboard, Users, User, ClipboardList, ListChecks, BarChart3, Medal, Megaphone, Bell, Settings,
} from "lucide-react";
import { requireMentor } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { DashboardShell, type NavSection } from "@/components/dashboard-shell";

export default async function MentorLayout({ children }: { children: ReactNode }) {
  const user = await requireMentor();
  const unread = await prisma.notification.count({ where: { userId: user.id, isRead: false } });

  const sections: NavSection[] = [
    {
      items: [
        { href: "/mentor/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
        { href: "/mentor/groups", label: "My Groups", icon: <Users className="h-4 w-4" /> },
        { href: "/mentor/students", label: "Students", icon: <User className="h-4 w-4" /> },
      ],
    },
    {
      title: "Teaching",
      items: [
        { href: "/mentor/tests", label: "Tests", icon: <ClipboardList className="h-4 w-4" /> },
        { href: "/mentor/tasks", label: "Tasks", icon: <ListChecks className="h-4 w-4" /> },
        { href: "/mentor/announcements", label: "Announcements", icon: <Megaphone className="h-4 w-4" /> },
      ],
    },
    {
      title: "Insights",
      items: [
        { href: "/mentor/leaderboards", label: "Leaderboards", icon: <Medal className="h-4 w-4" /> },
        { href: "/mentor/performance", label: "Performance", icon: <BarChart3 className="h-4 w-4" /> },
      ],
    },
    {
      title: "Account",
      items: [
        { href: "/mentor/profile", label: "Profile", icon: <User className="h-4 w-4" /> },
        { href: "/mentor/notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
        { href: "/mentor/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
      ],
    },
  ];

  return (
    <DashboardShell
      user={{ fullName: user.fullName, email: user.email, role: user.role, avatarUrl: user.avatarUrl }}
      sections={sections}
      unreadCount={unread}
    >
      {children}
    </DashboardShell>
  );
}
