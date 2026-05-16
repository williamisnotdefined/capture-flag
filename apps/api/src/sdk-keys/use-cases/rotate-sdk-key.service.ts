import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { createAuditLog, toAuditJson } from "../../common/audit-log";
import { createRawSdkKey, hashSdkKey } from "../../common/sdk-key-crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { SdkKeyAccessService, SdkKeyAuditService, sdkKeySelect } from "../support";

export type RotateSdkKeyInput = {
  sdkKeyId: string;
  userId: string;
};

@Injectable()
export class RotateSdkKeyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sdkKeyAccess: SdkKeyAccessService,
    private readonly sdkKeyAudit: SdkKeyAuditService,
  ) {}

  async execute({ userId, sdkKeyId }: RotateSdkKeyInput) {
    const sdkKey = await this.sdkKeyAccess.findSdkKeyForWrite(userId, sdkKeyId);

    if (sdkKey.revokedAt) {
      throw new BadRequestException("SDK key is already revoked");
    }

    const rawKey = createRawSdkKey();
    const keyPrefix = rawKey.slice(0, 18);
    const keyHash = hashSdkKey(rawKey);

    return this.prisma.$transaction(async (tx) => {
      const revokeResult = await tx.sdkKey.updateMany({
        where: { id: sdkKeyId, revokedAt: null },
        data: {
          revokedAt: new Date(),
        },
      });

      if (revokeResult.count !== 1) {
        throw new BadRequestException("SDK key is already revoked");
      }

      const revokedSdkKey = await tx.sdkKey.findUnique({
        where: { id: sdkKeyId },
        select: sdkKeySelect(),
      });
      if (!revokedSdkKey) {
        throw new NotFoundException("SDK key not found");
      }

      const nextSdkKey = await tx.sdkKey.create({
        data: {
          projectId: sdkKey.projectId,
          configId: sdkKey.configId,
          environmentId: sdkKey.environmentId,
          name: sdkKey.name,
          keyPrefix,
          keyHash,
        },
        select: sdkKeySelect(),
      });

      await createAuditLog(tx, {
        action: "sdk_key.revoked",
        actorUserId: userId,
        configId: sdkKey.configId,
        entityId: sdkKeyId,
        entityType: "sdk_key",
        metadata: toAuditJson({
          environmentId: sdkKey.environmentId,
          keyPrefix: sdkKey.keyPrefix,
          rotatedToSdkKeyId: nextSdkKey.id,
        }),
        newValue: this.sdkKeyAudit.sdkKeyAuditValue(revokedSdkKey),
        oldValue: this.sdkKeyAudit.sdkKeyAuditValue(sdkKey),
        organizationId: sdkKey.project.organizationId,
        projectId: sdkKey.projectId,
      });
      await createAuditLog(tx, {
        action: "sdk_key.created",
        actorUserId: userId,
        configId: sdkKey.configId,
        entityId: nextSdkKey.id,
        entityType: "sdk_key",
        metadata: toAuditJson({
          environmentId: sdkKey.environmentId,
          keyPrefix,
          rotatedFromSdkKeyId: sdkKeyId,
        }),
        newValue: this.sdkKeyAudit.sdkKeyAuditValue(nextSdkKey),
        organizationId: sdkKey.project.organizationId,
        projectId: sdkKey.projectId,
      });
      await createAuditLog(tx, {
        action: "sdk_key.rotated",
        actorUserId: userId,
        configId: sdkKey.configId,
        entityId: nextSdkKey.id,
        entityType: "sdk_key",
        metadata: toAuditJson({
          environmentId: sdkKey.environmentId,
          rotatedFromSdkKeyId: sdkKeyId,
          rotatedToSdkKeyId: nextSdkKey.id,
        }),
        newValue: this.sdkKeyAudit.sdkKeyAuditValue(nextSdkKey),
        oldValue: this.sdkKeyAudit.sdkKeyAuditValue(revokedSdkKey),
        organizationId: sdkKey.project.organizationId,
        projectId: sdkKey.projectId,
      });

      return {
        ...nextSdkKey,
        key: rawKey,
      };
    });
  }
}
