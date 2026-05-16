import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  FeatureFlagAccessService,
  FeatureFlagAuditService,
  FeatureFlagConfigStateService,
  FeatureFlagReferenceService,
  type FeatureFlagUpdateInput,
  FeatureFlagUpdateInputService,
  featureFlagInclude,
} from "../support";

export type UpdateFeatureFlagInput = {
  configId: string;
  featureFlagId: string;
  input: FeatureFlagUpdateInput;
  userId: string;
};

@Injectable()
export class UpdateFeatureFlagService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly featureFlagAccess: FeatureFlagAccessService,
    private readonly featureFlagAudit: FeatureFlagAuditService,
    private readonly featureFlagConfigState: FeatureFlagConfigStateService,
    private readonly featureFlagReference: FeatureFlagReferenceService,
    private readonly featureFlagUpdateInput: FeatureFlagUpdateInputService,
  ) {}

  async execute({ userId, configId, featureFlagId, input }: UpdateFeatureFlagInput) {
    const config = await this.featureFlagAccess.findConfigForWrite(userId, configId);
    const flag = await this.featureFlagAccess.findActiveFlag(configId, featureFlagId);

    const update = await this.featureFlagUpdateInput.normalize({
      flag,
      input,
      organizationId: config.project.organizationId,
    });

    if (update.changedFields.length === 0) {
      return this.prisma.featureFlag.findUnique({
        where: { id: featureFlagId },
        include: featureFlagInclude(),
      });
    }

    return this.prisma.$transaction(
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

        if (update.publicChanged) {
          await this.featureFlagReference.ensureFlagIsNotReferenced(
            tx,
            currentFlag.configId,
            currentFlag.key,
            "rename",
          );
        }

        const updatedFlag = await tx.featureFlag.update({
          where: { id: featureFlagId },
          data: update.data,
        });

        const environmentIds = update.publicChanged
          ? await this.featureFlagConfigState.bumpForFlagUpdate(tx, {
              actorUserId: userId,
              configId: currentFlag.configId,
              featureFlagId,
              organizationId: config.project.organizationId,
              projectId: currentFlag.projectId,
            })
          : [];

        await this.featureFlagAudit.writeFlagUpdated(tx, {
          actorUserId: userId,
          changedFields: update.changedFields,
          currentFlag,
          environmentIds,
          organizationId: config.project.organizationId,
          publicChanged: update.publicChanged,
          updatedFlag,
        });

        return tx.featureFlag.findUnique({
          where: { id: featureFlagId },
          include: featureFlagInclude(),
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
