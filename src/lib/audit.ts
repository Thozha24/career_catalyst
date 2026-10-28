import { prisma } from "./prisma";

export type AuditInput = {
  actorId?: string | null;
  action: string;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
};

/**
 * Append-only audit trail for security-sensitive actions.
 * Never exposed to ordinary users (admin-only via /admin/audit-logs).
 */
export async function audit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        ip: input.ip,
        userAgent: input.userAgent?.slice(0, 300),
      },
    });
  } catch {
    // auditing must never break the primary request path
  }
}
