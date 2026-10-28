import type { ReactNode } from "react";
import {
  LayoutDashboard, BookOpen, Code2, ClipboardList, ListChecks, Users, UserCheck,
  Trophy, Medal, User, Bell, Settings,
} from "lucide-react";
import { requireStudent } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { DashboardShell, type NavSection } from "@/components/dashboard-shell";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const user = await requireStudent();
  const unread = await prisma.notification.count({ where: { userId: user.id, isRead: false } });

  const sections: NavSection[] = [
    {
      items: [
        { href: "/student/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
        { href: "/student/learn", label: "Learn", icon: <BookOpen className="h-4 w-4" /> },
        { href: "/student/practice", label: "Coding Practice", icon: <Code2 className="h-4 w-4" /> },
        { href: "/student/tests", label: "Tests", icon: <ClipboardList className="h-4 w-4" /> },
        { href: "/student/tasks", label: "Tasks", icon: <ListChecks className="h-4 w-4" /> },
      ],
    },
    {
      title: "Mentorship",
      items: [
        { href: "/student/group", label: "My Group", icon: <Users className="h-4 w-4" /> },
        { href: "/student/mentor", label: "Mentor", icon: <UserCheck className="h-4 w-4" /> },
      ],
    },
    {
      title: "Progress",
      items: [
        { href: "/student/leaderboard", label: "Leaderboard", icon: <Medal className="h-4 w-4" /> },
        { href: "/student/achievements", label: "Achievements", icon: <Trophy className="h-4 w-4" /> },
      ],
    },
    {
      title: "Account",
      items: [
        { href: "/student/profile", label: "Profile", icon: <User className="h-4 w-4" /> },
        { href: "/student/notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
        { href: "/student/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
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
