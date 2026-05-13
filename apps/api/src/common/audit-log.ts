import { Prisma } from "@prisma/client";

export function toAuditJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function createAuditLog(
  tx: Prisma.TransactionClient,
  input: {
    action: string;
    actorUserId?: string | null;
    configId?: string | null;
    entityId: string;
    entityType: string;
    metadata?: Prisma.InputJsonValue;
    newValue?: Prisma.InputJsonValue;
    oldValue?: Prisma.InputJsonValue;
    organizationId: string;
    projectId?: string | null;
  },
) {
  await tx.auditLog.create({
    data: {
      action: input.action,
      actorUserId: input.actorUserId ?? null,
      configId: input.configId ?? null,
      entityId: input.entityId,
      entityType: input.entityType,
      metadata: input.metadata ?? {},
      newValue: input.newValue,
      oldValue: input.oldValue,
      organizationId: input.organizationId,
      projectId: input.projectId ?? null,
    },
  });
}
