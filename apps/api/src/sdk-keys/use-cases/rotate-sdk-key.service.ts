import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  SdkKeyAccessService,
  SdkKeyAuditService,
  SdkKeyCredentialService,
  sdkKeySelect,
} from "../support";

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
    private readonly sdkKeyCredential: SdkKeyCredentialService,
  ) {}

  async execute({ userId, sdkKeyId }: RotateSdkKeyInput) {
    const sdkKey = await this.sdkKeyAccess.findSdkKeyForWrite(userId, sdkKeyId);

    if (sdkKey.revokedAt) {
      throw new BadRequestException("SDK key is already revoked");
    }

    const credential = this.sdkKeyCredential.createCredential();

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
          keyPrefix: credential.keyPrefix,
          keyHash: credential.keyHash,
        },
        select: sdkKeySelect(),
      });

      await this.sdkKeyAudit.writeSdkKeyRevoked(tx, {
        actorUserId: userId,
        oldSdkKey: sdkKey,
        organizationId: sdkKey.project.organizationId,
        revokedSdkKey,
        rotatedToSdkKeyId: nextSdkKey.id,
      });
      await this.sdkKeyAudit.writeSdkKeyCreated(tx, {
        actorUserId: userId,
        organizationId: sdkKey.project.organizationId,
        rotatedFromSdkKeyId: sdkKeyId,
        sdkKey: nextSdkKey,
      });
      await this.sdkKeyAudit.writeSdkKeyRotated(tx, {
        actorUserId: userId,
        organizationId: sdkKey.project.organizationId,
        revokedSdkKey,
        rotatedFromSdkKeyId: sdkKeyId,
        rotatedToSdkKeyId: nextSdkKey.id,
        toSdkKey: nextSdkKey,
      });

      return {
        ...nextSdkKey,
        key: credential.rawKey,
      };
    });
  }
}
