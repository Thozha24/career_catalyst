import type { ReactNode } from "react";
import { LayoutDashboard, Users, Group, ScrollText } from "lucide-react";
import { requireAdmin } from "@/lib/guards";
import { DashboardShell, type NavSection } from "@/components/dashboard-shell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();

  const sections: NavSection[] = [
    {
      items: [
        { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
        { href: "/admin/users", label: "Users", icon: <Users className="h-4 w-4" /> },
        { href: "/admin/groups", label: "Groups", icon: <Group className="h-4 w-4" /> },
        { href: "/admin/audit-logs", label: "Audit Logs", icon: <ScrollText className="h-4 w-4" /> },
      ],
    },
  ];

  return (
    <DashboardShell
      user={{ fullName: user.fullName, email: user.email, role: user.role, avatarUrl: user.avatarUrl }}
      sections={sections}
      unreadCount={0}
    >
      {children}
    </DashboardShell>
  );
}
