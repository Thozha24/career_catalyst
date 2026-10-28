import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import { requireAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody, Badge, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const dangerous = new Set([
  "ACCOUNT_SUSPENDED", "ROLE_CHANGED", "PASSWORD_RESET", "PASSWORD_CHANGED",
  "LOGIN_FAILED", "ACCOUNT_REACTIVATED", "TEST_CREATED", "TASK_CREATED",
]);

type Props = { searchParams: Promise<{ page?: string; action?: string }> };

export default async function AdminAuditLogsPage({ searchParams }: Props) {
  await requireAdmin();
  const { page = "1", action = "" } = await searchParams;
  const pageNo = Math.max(1, parseInt(page, 10) || 1);

  const where = action ? { action: { contains: action.toUpperCase() } } : {};

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNo - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { fullName: true, role: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Audit logs"
        description="Security-sensitive actions across the platform — actor, action, resource, timestamp and metadata."
      />

      <Card>
        <CardHeader
          title={`${total} recorded event${total === 1 ? "" : "s"}`}
          icon={<ScrollText className="h-4 w-4" />}
          subtitle="Only admins can see this page; events are never exposed in public APIs"
          action={
            <form action="/admin/audit-logs" method="GET" className="flex items-center gap-2">
              <input name="action" defaultValue={action} placeholder="Filter action…" className="input-base h-8 w-40 text-xs" aria-label="Filter by action" />
              <button className="h-8 rounded-lg bg-primary-600 px-3 text-xs font-semibold text-white hover:bg-primary-500" type="submit">Search</button>
            </form>
          }
        />
        <CardBody>
          {logs.length === 0 ? (
            <EmptyState icon={<ScrollText className="h-6 w-6" />} title="No audit events" description="Events appear as users and admins perform sensitive actions." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-2 pr-3 font-semibold">When</th>
                    <th className="pb-2 pr-3 font-semibold">Actor</th>
                    <th className="pb-2 pr-3 font-semibold">Action</th>
                    <th className="pb-2 pr-3 font-semibold">Resource</th>
                    <th className="pb-2 font-semibold">Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} data-testid={`audit-${log.id}`} className="align-top hover:bg-slate-50/60">
                      <td className="whitespace-nowrap py-2.5 pr-3 text-xs text-slate-500">{formatDate(log.createdAt)}</td>
                      <td className="py-2.5 pr-3">
                        <span className="font-medium text-ink">{log.actor?.fullName ?? "System"}</span>
                        {log.actor ? <span className="ml-1 text-xs text-slate-400">({log.actor.role})</span> : null}
                      </td>
                      <td className="py-2.5 pr-3">
                        <Badge tone={dangerous.has(log.action) ? "warning" : "neutral"}>{log.action}</Badge>
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-slate-500">
                        {log.resource ?? "—"}
                        {log.resourceId ? <span className="block font-mono text-[11px] text-slate-300">{log.resourceId}</span> : null}
                      </td>
                      <td className="py-2.5 font-mono text-[11px] text-slate-400">
                        {log.metadata ? (log.metadata.length > 120 ? `${log.metadata.slice(0, 120)}…` : log.metadata) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>Page {pageNo} of {totalPages}</span>
              <div className="flex gap-2">
                {pageNo > 1 ? (
                  <a href={`/admin/audit-logs?page=${pageNo - 1}${action ? `&action=${encodeURIComponent(action)}` : ""}`} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold hover:bg-slate-50"><ChevronLeft className="h-3.5 w-3.5" /> Prev</a>
                ) : null}
                {pageNo < totalPages ? (
                  <a href={`/admin/audit-logs?page=${pageNo + 1}${action ? `&action=${encodeURIComponent(action)}` : ""}`} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold hover:bg-slate-50">Next <ChevronRight className="h-3.5 w-3.5" /></a>
                ) : null}
              </div>
            </div>
          ) : null}
        </CardBody>
      </Card>
    </>
  );
}
