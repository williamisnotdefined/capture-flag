import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { createAuditLog, toAuditJson } from "../../common/audit-log";

type ConfigAuditValue = {
  description?: string | null;
  id: string;
  key: string;
  name: string;
  projectId: string;
};

@Injectable()
export class ConfigAuditService {
  async createConfigCreatedLog(
    tx: Prisma.TransactionClient,
    input: {
      actorUserId: string;
      config: ConfigAuditValue;
      environmentIds: string[];
      organizationId: string;
      projectId: string;
    },
  ) {
    await createAuditLog(tx, {
      action: "config.created",
      actorUserId: input.actorUserId,
      configId: input.config.id,
      entityId: input.config.id,
      entityType: "config",
      metadata: toAuditJson({ environmentIds: input.environmentIds }),
      newValue: this.configAuditValue(input.config),
      organizationId: input.organizationId,
      projectId: input.projectId,
    });
  }

  async createConfigDeletedLog(
    tx: Prisma.TransactionClient,
    input: {
      actorUserId: string;
      config: ConfigAuditValue;
      organizationId: string;
      projectId: string;
    },
  ) {
    await createAuditLog(tx, {
      action: "config.deleted",
      actorUserId: input.actorUserId,
      entityId: input.config.id,
      entityType: "config",
      oldValue: this.configAuditValue(input.config),
      organizationId: input.organizationId,
      projectId: input.projectId,
    });
  }

  async createConfigUpdatedLog(
    tx: Prisma.TransactionClient,
    input: {
      actorUserId: string;
      changedFields: string[];
      currentConfig: ConfigAuditValue;
      organizationId: string;
      projectId: string;
      updatedConfig: ConfigAuditValue;
    },
  ) {
    await createAuditLog(tx, {
      action: "config.updated",
      actorUserId: input.actorUserId,
      configId: input.updatedConfig.id,
      entityId: input.updatedConfig.id,
      entityType: "config",
      metadata: toAuditJson({ changedFields: input.changedFields, publicChanged: false }),
      newValue: this.configAuditValue(input.updatedConfig),
      oldValue: this.configAuditValue(input.currentConfig),
      organizationId: input.organizationId,
      projectId: input.projectId,
    });
  }

  configAuditValue(config: ConfigAuditValue) {
    return toAuditJson({
      description: config.description ?? null,
      id: config.id,
      key: config.key,
      name: config.name,
      projectId: config.projectId,
    });
  }
}
