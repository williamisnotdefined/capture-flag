import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  SdkKeyAccessService,
  SdkKeyAuditService,
  sdkKeySelect,
  sdkKeyWithProjectSelect,
} from "../support";

export type BulkRevokeSdkKeysInput = {
  projectId: string;
  sdkKeyIds: string[];
  userId: string;
};

@Injectable()
export class BulkRevokeSdkKeysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sdkKeyAccess: SdkKeyAccessService,
    private readonly sdkKeyAudit: SdkKeyAuditService,
  ) {}

  async execute({ userId, projectId, sdkKeyIds }: BulkRevokeSdkKeysInput) {
    await this.sdkKeyAccess.requireProjectWrite(userId, projectId);

    const sdkKeys = await this.prisma.sdkKey.findMany({
      where: { id: { in: sdkKeyIds }, projectId },
      select: sdkKeyWithProjectSelect(),
    });

    if (sdkKeys.length !== sdkKeyIds.length) {
      throw new NotFoundException("SDK key not found");
    }

    if (sdkKeys.some((sdkKey) => sdkKey.revokedAt)) {
      throw new BadRequestException("SDK key is already revoked");
    }

    const revokedAt = new Date();

    const revokedSdkKeys = await this.prisma.$transaction(async (tx) => {
      const revokeResult = await tx.sdkKey.updateMany({
        where: { id: { in: sdkKeyIds }, projectId, revokedAt: null },
        data: { revokedAt },
      });

      if (revokeResult.count !== sdkKeyIds.length) {
        throw new BadRequestException("SDK key is already revoked");
      }

      const updatedSdkKeys = await tx.sdkKey.findMany({
        where: { id: { in: sdkKeyIds }, projectId },
        select: sdkKeySelect(),
      });

      if (updatedSdkKeys.length !== sdkKeyIds.length) {
        throw new NotFoundException("SDK key not found");
      }

      const updatedSdkKeysById = new Map(updatedSdkKeys.map((sdkKey) => [sdkKey.id, sdkKey]));

      for (const sdkKey of sdkKeys) {
        const revokedSdkKey = updatedSdkKeysById.get(sdkKey.id);
        if (!revokedSdkKey) {
          throw new NotFoundException("SDK key not found");
        }

        await this.sdkKeyAudit.writeSdkKeyRevoked(tx, {
          actorUserId: userId,
          oldSdkKey: sdkKey,
          organizationId: sdkKey.project.organizationId,
          revokedSdkKey,
        });
      }

      return updatedSdkKeys;
    });

    return { ok: true, count: revokedSdkKeys.length };
  }
}
