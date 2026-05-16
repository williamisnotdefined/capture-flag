import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
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

      await this.sdkKeyAudit.writeSdkKeyRevoked(tx, {
        actorUserId: userId,
        oldSdkKey: sdkKey,
        organizationId: sdkKey.project.organizationId,
        revokedSdkKey,
      });

      return revokedSdkKey;
    });
  }
}
