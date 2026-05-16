import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createAuditLog, toAuditJson } from "../../common/audit-log";

type SdkKeyAuditValueInput = {
  configId: string;
  environmentId: string;
  id: string;
  keyPrefix: string;
  lastUsedAt?: Date | null;
  name: string;
  projectId: string;
  revokedAt?: Date | null;
};

@Injectable()
export class SdkKeyAuditService {
  async writeSdkKeyCreated(
    tx: Prisma.TransactionClient,
    input: {
      actorUserId: string;
      organizationId: string;
      rotatedFromSdkKeyId?: string;
      sdkKey: SdkKeyAuditValueInput;
    },
  ) {
    await createAuditLog(tx, {
      action: "sdk_key.created",
      actorUserId: input.actorUserId,
      configId: input.sdkKey.configId,
      entityId: input.sdkKey.id,
      entityType: "sdk_key",
      metadata: toAuditJson({
        environmentId: input.sdkKey.environmentId,
        keyPrefix: input.sdkKey.keyPrefix,
        ...(input.rotatedFromSdkKeyId ? { rotatedFromSdkKeyId: input.rotatedFromSdkKeyId } : {}),
      }),
      newValue: this.sdkKeyAuditValue(input.sdkKey),
      organizationId: input.organizationId,
      projectId: input.sdkKey.projectId,
    });
  }

  async writeSdkKeyRevoked(
    tx: Prisma.TransactionClient,
    input: {
      actorUserId: string;
      oldSdkKey: SdkKeyAuditValueInput;
      organizationId: string;
      revokedSdkKey: SdkKeyAuditValueInput;
      rotatedToSdkKeyId?: string;
    },
  ) {
    await createAuditLog(tx, {
      action: "sdk_key.revoked",
      actorUserId: input.actorUserId,
      configId: input.oldSdkKey.configId,
      entityId: input.oldSdkKey.id,
      entityType: "sdk_key",
      metadata: toAuditJson({
        environmentId: input.oldSdkKey.environmentId,
        keyPrefix: input.oldSdkKey.keyPrefix,
        ...(input.rotatedToSdkKeyId ? { rotatedToSdkKeyId: input.rotatedToSdkKeyId } : {}),
      }),
      newValue: this.sdkKeyAuditValue(input.revokedSdkKey),
      oldValue: this.sdkKeyAuditValue(input.oldSdkKey),
      organizationId: input.organizationId,
      projectId: input.oldSdkKey.projectId,
    });
  }

  async writeSdkKeyRotated(
    tx: Prisma.TransactionClient,
    input: {
      actorUserId: string;
      organizationId: string;
      revokedSdkKey: SdkKeyAuditValueInput;
      rotatedFromSdkKeyId: string;
      rotatedToSdkKeyId: string;
      toSdkKey: SdkKeyAuditValueInput;
    },
  ) {
    await createAuditLog(tx, {
      action: "sdk_key.rotated",
      actorUserId: input.actorUserId,
      configId: input.revokedSdkKey.configId,
      entityId: input.toSdkKey.id,
      entityType: "sdk_key",
      metadata: toAuditJson({
        environmentId: input.revokedSdkKey.environmentId,
        rotatedFromSdkKeyId: input.rotatedFromSdkKeyId,
        rotatedToSdkKeyId: input.rotatedToSdkKeyId,
      }),
      newValue: this.sdkKeyAuditValue(input.toSdkKey),
      oldValue: this.sdkKeyAuditValue(input.revokedSdkKey),
      organizationId: input.organizationId,
      projectId: input.revokedSdkKey.projectId,
    });
  }

  sdkKeyAuditValue(sdkKey: SdkKeyAuditValueInput) {
    return toAuditJson({
      configId: sdkKey.configId,
      environmentId: sdkKey.environmentId,
      id: sdkKey.id,
      keyPrefix: sdkKey.keyPrefix,
      lastUsedAt: sdkKey.lastUsedAt?.toISOString() ?? null,
      name: sdkKey.name,
      projectId: sdkKey.projectId,
      revokedAt: sdkKey.revokedAt?.toISOString() ?? null,
    });
  }
}
