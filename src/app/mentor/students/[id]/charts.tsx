"use client";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Legend,
} from "recharts";
import { formatRelative } from "@/lib/format";

export function ScoreTrendChart({ data }: { data: { label: string; value: number; passed: boolean }[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} interval={0} angle={-30} textAnchor="end" height={50} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} />
          <Tooltip
            formatter={(value: number | string) => [`${value}%`, "Score"]}
            labelFormatter={(label: string) => String(label)}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
          />
          <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={2.5} dot={{ r: 3.5, fill: "#8B5CF6" }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ActivityChart({ lessons, problems }: { lessons: string[]; problems: string[] }) {
  // Build last 8 weeks of counts
  const weeks: { label: string; lessons: number; problems: number }[] = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7 + 1);
    const start = new Date(end.getTime() - 7 * 24 * 3600 * 1000);
    weeks.push({
      label: i === 0 ? "This wk" : `-${i}w`,
      lessons: lessons.filter((d) => { const t = new Date(d).getTime(); return t >= start.getTime() && t < end.getTime(); }).length,
      problems: problems.filter((d) => { const t = new Date(d).getTime(); return t >= start.getTime() && t < end.getTime(); }).length,
    });
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={weeks} margin={{ top: 8, right: 8, bottom: 0, left: -18 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="lessons" name="Lessons" fill="#6366F1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="problems" name="Problems" fill="#10B981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
