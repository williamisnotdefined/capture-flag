import type { Prisma } from "@prisma/client";
import { createAuditLog, toAuditJson } from "./audit-log";

type ConfigPublishedAuditInput = {
  actorUserId?: string | null;
  metadata?: Prisma.InputJsonValue;
  organizationId: string;
  projectId: string;
  sourceAction: string;
  sourceEntityId: string;
  sourceEntityType: string;
};

export function createConfigEnvironmentEtag(
  configId: string,
  environmentId: string,
  revision: number,
): string {
  return `W/"cf-${revision}-${configId.slice(0, 8)}-${environmentId.slice(0, 8)}"`;
}

export async function bumpConfigEnvironmentState(
  tx: Prisma.TransactionClient,
  configId: string,
  environmentId: string,
  audit?: ConfigPublishedAuditInput,
) {
  if (audit) {
    return bumpConfigEnvironmentStateWithAudit(tx, configId, environmentId, audit);
  }

  const updateResult = await tx.configEnvironmentState.updateMany({
    where: {
      configId,
      environmentId,
    },
    data: {
      revision: { increment: 1 },
      generatedAt: new Date(),
    },
  });

  if (updateResult.count === 0) {
    return null;
  }

  const currentState = await tx.configEnvironmentState.findUnique({
    where: {
      configId_environmentId: {
        configId,
        environmentId,
      },
    },
    select: {
      revision: true,
    },
  });

  if (!currentState) {
    return null;
  }

  return tx.configEnvironmentState.update({
    where: {
      configId_environmentId: {
        configId,
        environmentId,
      },
    },
    data: {
      etag: createConfigEnvironmentEtag(configId, environmentId, currentState.revision),
    },
  });
}

async function bumpConfigEnvironmentStateWithAudit(
  tx: Prisma.TransactionClient,
  configId: string,
  environmentId: string,
  audit: ConfigPublishedAuditInput,
) {
  const previousState = await tx.configEnvironmentState.findUnique({
    where: {
      configId_environmentId: {
        configId,
        environmentId,
      },
    },
    select: {
      etag: true,
      generatedAt: true,
      id: true,
      revision: true,
    },
  });

  if (!previousState) {
    return null;
  }

  const updateResult = await tx.configEnvironmentState.updateMany({
    where: {
      configId,
      environmentId,
    },
    data: {
      revision: { increment: 1 },
      generatedAt: new Date(),
    },
  });

  if (updateResult.count === 0) {
    return null;
  }

  const currentState = await tx.configEnvironmentState.findUnique({
    where: {
      configId_environmentId: {
        configId,
        environmentId,
      },
    },
    select: {
      generatedAt: true,
      revision: true,
    },
  });

  if (!currentState) {
    return null;
  }

  const updatedState = await tx.configEnvironmentState.update({
    where: {
      configId_environmentId: {
        configId,
        environmentId,
      },
    },
    data: {
      etag: createConfigEnvironmentEtag(configId, environmentId, currentState.revision),
    },
  });

  if (!updatedState) {
    return null;
  }

  await createAuditLog(tx, {
    action: "config.published",
    actorUserId: audit.actorUserId,
    configId,
    entityId: updatedState.id,
    entityType: "config_environment_state",
    metadata: toAuditJson({
      ...(audit.metadata && typeof audit.metadata === "object" && !Array.isArray(audit.metadata)
        ? audit.metadata
        : {}),
      environmentId,
      sourceAction: audit.sourceAction,
      sourceEntityId: audit.sourceEntityId,
      sourceEntityType: audit.sourceEntityType,
    }),
    newValue: toAuditJson({
      etag: updatedState.etag,
      generatedAt: updatedState.generatedAt,
      revision: updatedState.revision,
    }),
    oldValue: toAuditJson({
      etag: previousState.etag,
      generatedAt: previousState.generatedAt,
      revision: previousState.revision,
    }),
    organizationId: audit.organizationId,
    projectId: audit.projectId,
  });

  return updatedState;
}
