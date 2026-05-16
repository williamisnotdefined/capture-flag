import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { createAuditLog, toAuditJson } from "../../common/audit-log";
import { PrismaService } from "../../prisma/prisma.service";
import { SdkKeyAccessService, SdkKeyAuditService, sdkKeySelect } from "../support";

export type RevokeSdkKeyInput = {
  sdkKeyId: string;
  userId: string;
};

@Injectable()
export class RevokeSdkKeyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sdkKeyAccess: SdkKeyAccessService,
    private readonly sdkKeyAudit: SdkKeyAuditService,
  ) {}

  async execute({ userId, sdkKeyId }: RevokeSdkKeyInput) {
    const sdkKey = await this.sdkKeyAccess.findSdkKeyForWrite(userId, sdkKeyId);

    if (sdkKey.revokedAt) {
      throw new BadRequestException("SDK key is already revoked");
    }

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

      await createAuditLog(tx, {
        action: "sdk_key.revoked",
        actorUserId: userId,
        configId: sdkKey.configId,
        entityId: sdkKeyId,
        entityType: "sdk_key",
        metadata: toAuditJson({ environmentId: sdkKey.environmentId, keyPrefix: sdkKey.keyPrefix }),
        newValue: this.sdkKeyAudit.sdkKeyAuditValue(revokedSdkKey),
        oldValue: this.sdkKeyAudit.sdkKeyAuditValue(sdkKey),
        organizationId: sdkKey.project.organizationId,
        projectId: sdkKey.projectId,
      });

      return revokedSdkKey;
    });
  }
}
