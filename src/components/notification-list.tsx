"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Bell, CheckCheck, ClipboardList, ListChecks, MessageSquareQuote, Megaphone, Trophy, Zap, Info } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, Card } from "@/components/ui";
import { formatRelative } from "@/lib/format";
import { useToast } from "@/components/ui-client";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

function iconFor(type: string) {
  const cls = "h-4 w-4";
  switch (type) {
    case "NEW_TEST":
    case "DEADLINE":
      return <ClipboardList className={cn(cls, "text-info-600")} />;
    case "NEW_TASK":
    case "TASK_FEEDBACK":
      return <ListChecks className={cn(cls, "text-primary-600")} />;
    case "MENTOR_FEEDBACK":
      return <MessageSquareQuote className={cn(cls, "text-secondary-600")} />;
    case "GROUP_ANNOUNCEMENT":
      return <Megaphone className={cn(cls, "text-warning-600")} />;
    case "ACHIEVEMENT":
      return <Trophy className={cn(cls, "text-warning-600")} />;
    case "POINTS":
      return <Zap className={cn(cls, "text-warning-600")} />;
    case "SYSTEM":
      return <Info className={cn(cls, "text-slate-500")} />;
    default:
      return <Bell className={cn(cls, "text-slate-500")} />;
  }
}

export function NotificationList({ items }: { items: NotificationItem[] }) {
  const router = useRouter();
  const { push } = useToast();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  const unread = items.filter((n) => !n.isRead).length;

  async function mark(payload: { id?: string; all?: boolean }) {
    setBusy(true);
    try {
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        push("Could not update notifications.", "error");
        return;
      }
      push(payload.all ? "All notifications marked as read" : "Marked as read");
      startTransition(() => router.refresh());
    } catch {
      push("Network error.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => void mark({ all: true })} disabled={busy || pending || unread === 0}>
          <CheckCheck className="h-3.5 w-3.5" /> Mark all read ({unread})
        </Button>
      </div>

      <Card>
        <ul className="divide-y divide-slate-100">
          {items.map((n) => (
            <li key={n.id} className={cn("flex items-start gap-3 px-5 py-4", !n.isRead && "bg-primary-50/40")}>
              <span className={cn("mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", n.isRead ? "bg-slate-50" : "bg-white ring-1 ring-primary-100")}>
                {iconFor(n.type)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={cn("text-sm", n.isRead ? "font-medium text-slate-600" : "font-bold text-ink")}>{n.title}</p>
                  {!n.isRead ? <span className="h-2 w-2 rounded-full bg-primary-500" aria-label="Unread" /> : null}
                </div>
                {n.body ? <p className="mt-0.5 text-sm text-slate-500">{n.body}</p> : null}
                <p className="mt-1 text-xs text-slate-400">{formatRelative(n.createdAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {n.link ? (
                  <Link href={n.link} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary-600 hover:bg-primary-50">
                    Open
                  </Link>
                ) : null}
                {!n.isRead ? (
                  <Button variant="ghost" size="sm" onClick={() => void mark({ id: n.id })} disabled={busy || pending}>
                    Mark read
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
