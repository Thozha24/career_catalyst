"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/ui-client";
import { signOut } from "@/app/actions/auth";
import { initials } from "@/lib/format";

export type NavItem = { href: string; label: string; icon: ReactNode };

export type NavSection = { title?: string; items: NavItem[] };

export function DashboardShell({
  user,
  sections,
  unreadCount,
  children,
}: {
  user: { fullName: string; email: string; role: string; avatarUrl: string | null };
  sections: NavSection[];
  unreadCount: number;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer on navigation
  useEffect(() => setMobileOpen(false), [pathname]);

  const roleLabel = user.role.charAt(0) + user.role.slice(1).toLowerCase();

  const nav = (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-5" aria-label="Dashboard navigation">
      {sections.map((section, si) => (
        <div key={si}>
          {section.title ? (
            <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">{section.title}</p>
          ) : null}
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = pathname === item.href || (item.href !== "/student/dashboard" && item.href !== "/mentor/dashboard" && item.href !== "/admin/dashboard" && pathname.startsWith(item.href + "/"));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                      active
                        ? "bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lift"
                        : "text-slate-600 hover:bg-primary-50 hover:text-primary-700"
                    )}
                  >
                    <span className={cn("shrink-0 transition-transform group-hover:scale-110", active && "text-white")}>{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <div className="mt-auto border-t border-slate-100 pt-4">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-600 text-xs font-bold text-white">
            {initials(user.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{user.fullName}</p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
        </div>
        <form action={signOut} className="px-1 pt-1">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-danger-50 hover:text-danger-600"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200/80 bg-white lg:block">
        <div className="flex h-16 items-center border-b border-slate-100 px-5">
          <Logo />
        </div>
        {nav}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
          <div className="animate-slide-in absolute inset-y-0 left-0 w-72 bg-white shadow-lift">
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
              <Logo />
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </div>
        </div>
      ) : null}

      {/* Main column */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-700 ring-1 ring-inset ring-primary-100 lg:hidden">
              {roleLabel}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Link
              href={user.role === "MENTOR" ? "/mentor/notifications" : user.role === "ADMIN" ? "/admin/dashboard" : "/student/notifications"}
              className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white animate-pop-bounce">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </Link>
            <ThemeToggle />
            <div className="ml-1 hidden items-center gap-2.5 border-l border-slate-200 pl-3 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-600 text-[11px] font-bold text-white">
                {initials(user.fullName)}
              </div>
              <div className="hidden md:block">
                <p className="max-w-[140px] truncate text-sm font-semibold leading-tight text-ink">{user.fullName}</p>
                <p className="text-[11px] leading-tight text-slate-400">{roleLabel}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
