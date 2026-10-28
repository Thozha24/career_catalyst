"use client";

import { Trophy, Flame } from "lucide-react";
import { Card, CardHeader, CardBody, Badge, Progress } from "@/components/ui";
import { initials } from "@/lib/format";

export type LeaderRow = { id: string; name: string; total: number; weekly: number; streak: number };

export function GroupLeaderboard({ rows, meId }: { rows: LeaderRow[]; meId: string | null }) {
  const top = Math.max(1, ...rows.map((r) => r.weekly));
  return (
    <Card>
      <CardHeader title="Group leaderboard" subtitle="Weekly & all-time points" icon={<Trophy className="h-4 w-4" />} />
      <CardBody>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">No members yet.</p>
        ) : (
          <div className="space-y-1">
            {rows.map((r, i) => (
              <div key={r.id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${r.id === meId ? "bg-primary-50 ring-1 ring-inset ring-primary-200" : ""}`}>
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${i === 0 ? "bg-warning-100 text-warning-700" : "bg-slate-100 text-slate-500"}`}>
                  #{i + 1}
                </span>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-secondary-600 text-[11px] font-bold text-white">
                  {initials(r.name)}
                </div>
                <p className={`min-w-0 flex-1 truncate text-sm ${r.id === meId ? "font-bold text-primary-800" : "font-medium text-slate-700"}`}>
                  {r.name}{r.id === meId ? " (you)" : ""}
                </p>
                {r.streak > 0 ? <Badge tone="warning"><Flame className="h-3 w-3" /> {r.streak}d</Badge> : null}
                <div className="hidden w-32 sm:block"><Progress value={r.weekly} max={top} tone={i === 0 ? "warning" : "primary"} /></div>
                <span className="hidden w-20 shrink-0 text-right text-xs text-slate-400 sm:block">{r.total.toLocaleString()} total</span>
                <span className="w-16 shrink-0 text-right text-sm font-bold tabular-nums text-ink">{r.weekly.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
