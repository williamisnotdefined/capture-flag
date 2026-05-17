import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  FeatureFlagAccessService,
  FeatureFlagAuditService,
  FeatureFlagConfigStateService,
  FeatureFlagReferenceService,
} from "../support";

export type BulkDeleteFeatureFlagsInput = {
  configId: string;
  featureFlagIds: string[];
  userId: string;
};

@Injectable()
export class BulkDeleteFeatureFlagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly featureFlagAccess: FeatureFlagAccessService,
    private readonly featureFlagAudit: FeatureFlagAuditService,
    private readonly featureFlagConfigState: FeatureFlagConfigStateService,
    private readonly featureFlagReference: FeatureFlagReferenceService,
  ) {}

  async execute({ userId, configId, featureFlagIds }: BulkDeleteFeatureFlagsInput) {
    const config = await this.featureFlagAccess.findConfigForWrite(userId, configId);
    const deletedAt = new Date();

    await this.prisma.$transaction(
      async (tx) => {
        const currentFlags = await tx.featureFlag.findMany({
          where: {
            configId,
            id: { in: featureFlagIds },
            deletedAt: null,
          },
        });

        if (currentFlags.length !== featureFlagIds.length) {
          throw new NotFoundException("Feature flag not found");
        }

        for (const currentFlag of currentFlags) {
          await this.featureFlagReference.ensureFlagIsNotReferenced(
            tx,
            currentFlag.configId,
            currentFlag.key,
            "delete",
          );
        }

        const deleteResult = await tx.featureFlag.updateMany({
          where: { configId, id: { in: featureFlagIds }, deletedAt: null },
          data: { deletedAt },
        });

        if (deleteResult.count !== featureFlagIds.length) {
          throw new NotFoundException("Feature flag not found");
        }

        for (const currentFlag of currentFlags) {
          const environmentIds = await this.featureFlagConfigState.bumpForFlagDelete(tx, {
            actorUserId: userId,
            configId: currentFlag.configId,
            featureFlagId: currentFlag.id,
            organizationId: config.project.organizationId,
            projectId: currentFlag.projectId,
          });

          await this.featureFlagAudit.writeFlagDeleted(tx, {
            actorUserId: userId,
            currentFlag,
            deletedFlag: { ...currentFlag, deletedAt },
            environmentIds,
            organizationId: config.project.organizationId,
          });
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return { ok: true, count: featureFlagIds.length };
  }
}
