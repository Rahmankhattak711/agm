import "server-only";
import prisma from "@/lib/prisma";

export async function createAuditLog(params: {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
}) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorId: params.actorId || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        metadata: (params.metadata as any) ?? undefined,
        ip: params.ip || null,
      },
    });
  } catch (error) {
    console.error("Failed to record audit log:", error);
    return null;
  }
}
