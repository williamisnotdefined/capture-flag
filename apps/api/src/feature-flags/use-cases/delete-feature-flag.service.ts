import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  FeatureFlagAccessService,
  FeatureFlagAuditService,
  FeatureFlagConfigStateService,
  FeatureFlagReferenceService,
} from "../support";

export type DeleteFeatureFlagInput = {
  configId: string;
  featureFlagId: string;
  userId: string;
};

@Injectable()
export class DeleteFeatureFlagService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly featureFlagAccess: FeatureFlagAccessService,
    private readonly featureFlagAudit: FeatureFlagAuditService,
    private readonly featureFlagConfigState: FeatureFlagConfigStateService,
    private readonly featureFlagReference: FeatureFlagReferenceService,
  ) {}

  async execute({ userId, configId, featureFlagId }: DeleteFeatureFlagInput) {
    const config = await this.featureFlagAccess.findConfigForWrite(userId, configId);

    await this.prisma.$transaction(
      async (tx) => {
        const currentFlag = await tx.featureFlag.findFirst({
          where: {
            configId,
            id: featureFlagId,
            deletedAt: null,
          },
        });
        if (!currentFlag) {
          throw new NotFoundException("Feature flag not found");
        }

        await this.featureFlagReference.ensureFlagIsNotReferenced(
          tx,
          currentFlag.configId,
          currentFlag.key,
          "delete",
        );

        const deletedFlag = await tx.featureFlag.update({
          where: { id: featureFlagId },
          data: { deletedAt: new Date() },
        });

        const environmentIds = await this.featureFlagConfigState.bumpForFlagDelete(tx, {
          actorUserId: userId,
          configId: currentFlag.configId,
          featureFlagId,
          organizationId: config.project.organizationId,
          projectId: currentFlag.projectId,
        });

        await this.featureFlagAudit.writeFlagDeleted(tx, {
          actorUserId: userId,
          currentFlag,
          deletedFlag,
          environmentIds,
          organizationId: config.project.organizationId,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return { ok: true };
  }
}
