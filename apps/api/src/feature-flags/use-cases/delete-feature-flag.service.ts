import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createAuditLog, toAuditJson } from "../../common/audit-log";
import { bumpConfigEnvironmentState } from "../../common/config-state";
import { PrismaService } from "../../prisma/prisma.service";
import { FeatureFlagSupportService } from "../support/feature-flag-support.service";

export type DeleteFeatureFlagInput = {
  configId: string;
  featureFlagId: string;
  userId: string;
};

@Injectable()
export class DeleteFeatureFlagService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly support: FeatureFlagSupportService,
  ) {}

  async execute({ userId, configId, featureFlagId }: DeleteFeatureFlagInput) {
    const config = await this.support.findConfigForWrite(userId, configId);

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

        await this.support.ensureFlagIsNotReferenced(
          tx,
          currentFlag.configId,
          currentFlag.key,
          "delete",
        );

        const deletedFlag = await tx.featureFlag.update({
          where: { id: featureFlagId },
          data: { deletedAt: new Date() },
        });

        const values = await tx.featureFlagEnvironmentValue.findMany({
          where: { featureFlagId },
          select: { environmentId: true },
        });

        for (const value of values) {
          await bumpConfigEnvironmentState(tx, currentFlag.configId, value.environmentId, {
            actorUserId: userId,
            metadata: toAuditJson({ featureFlagId }),
            organizationId: config.project.organizationId,
            projectId: currentFlag.projectId,
            sourceAction: "flag.deleted",
            sourceEntityId: featureFlagId,
            sourceEntityType: "feature_flag",
          });
        }

        await createAuditLog(tx, {
          action: "flag.deleted",
          actorUserId: userId,
          configId: currentFlag.configId,
          entityId: featureFlagId,
          entityType: "feature_flag",
          metadata: toAuditJson({ environmentIds: values.map((value) => value.environmentId) }),
          newValue: this.support.featureFlagAuditValue(deletedFlag),
          oldValue: this.support.featureFlagAuditValue(currentFlag),
          organizationId: config.project.organizationId,
          projectId: currentFlag.projectId,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return { ok: true };
  }
}
