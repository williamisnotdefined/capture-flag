import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createAuditLog, toAuditJson } from "../../common/audit-log";
import { bumpConfigEnvironmentState } from "../../common/config-state";
import { normalizeTags } from "../../common/flag-values";
import { PrismaService } from "../../prisma/prisma.service";
import { FeatureFlagSupportService } from "../support/feature-flag-support.service";

export type UpdateFeatureFlagInput = {
  configId: string;
  featureFlagId: string;
  input: {
    description?: string;
    hint?: string;
    key?: string;
    name?: string;
    ownerUserId?: string | null;
    tags?: unknown;
  };
  userId: string;
};

@Injectable()
export class UpdateFeatureFlagService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly support: FeatureFlagSupportService,
  ) {}

  async execute({ userId, configId, featureFlagId, input }: UpdateFeatureFlagInput) {
    const config = await this.support.findConfigForWrite(userId, configId);
    const flag = await this.support.findActiveFlag(configId, featureFlagId);

    const data: Prisma.FeatureFlagUncheckedUpdateInput = {};
    let receivedAnyField = false;

    if (input.key !== undefined) {
      receivedAnyField = true;
      const key = this.support.normalizeFlagKey(input.key);
      if (key !== flag.key) {
        data.key = key;
      }
    }

    if (input.name !== undefined) {
      receivedAnyField = true;
      const name = input.name.trim();
      if (!name) {
        throw new BadRequestException("Flag name is required");
      }
      if (name !== flag.name) {
        data.name = name;
      }
    }

    if (input.description !== undefined) {
      receivedAnyField = true;
      const description = input.description.trim() || null;
      if (description !== flag.description) {
        data.description = description;
      }
    }

    if (input.tags !== undefined) {
      receivedAnyField = true;
      const tags = normalizeTags(input.tags);
      if (JSON.stringify(tags) !== JSON.stringify(flag.tags)) {
        data.tags = tags;
      }
    }

    if (input.hint !== undefined) {
      receivedAnyField = true;
      const hint = input.hint.trim() || null;
      if (hint !== flag.hint) {
        data.hint = hint;
      }
    }

    if (input.ownerUserId !== undefined) {
      receivedAnyField = true;
      const ownerUserId = await this.support.normalizeOwnerUserId(
        input.ownerUserId,
        config.project.organizationId,
      );
      if (ownerUserId !== flag.ownerUserId) {
        data.ownerUserId = ownerUserId;
      }
    }

    if (!receivedAnyField) {
      throw new BadRequestException("No feature flag fields to update");
    }

    if (Object.keys(data).length === 0) {
      return this.prisma.featureFlag.findUnique({
        where: { id: featureFlagId },
        include: this.support.featureFlagInclude(),
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

        if (Object.prototype.hasOwnProperty.call(data, "key")) {
          await this.support.ensureFlagIsNotReferenced(
            tx,
            currentFlag.configId,
            currentFlag.key,
            "rename",
          );
        }

        const updatedFlag = await tx.featureFlag.update({
          where: { id: featureFlagId },
          data,
        });

        const publicChanged = Object.prototype.hasOwnProperty.call(data, "key");
        const values = publicChanged
          ? await tx.featureFlagEnvironmentValue.findMany({
              where: { featureFlagId },
              select: { environmentId: true },
            })
          : [];

        for (const value of values) {
          await bumpConfigEnvironmentState(tx, currentFlag.configId, value.environmentId, {
            actorUserId: userId,
            metadata: toAuditJson({ featureFlagId }),
            organizationId: config.project.organizationId,
            projectId: currentFlag.projectId,
            sourceAction: "flag.updated",
            sourceEntityId: featureFlagId,
            sourceEntityType: "feature_flag",
          });
        }

        await createAuditLog(tx, {
          action: "flag.updated",
          actorUserId: userId,
          configId: currentFlag.configId,
          entityId: featureFlagId,
          entityType: "feature_flag",
          metadata: toAuditJson({
            changedFields: Object.keys(data),
            environmentIds: values.map((value) => value.environmentId),
            publicChanged,
          }),
          newValue: this.support.featureFlagAuditValue(updatedFlag),
          oldValue: this.support.featureFlagAuditValue(currentFlag),
          organizationId: config.project.organizationId,
          projectId: currentFlag.projectId,
        });

        return tx.featureFlag.findUnique({
          where: { id: featureFlagId },
          include: this.support.featureFlagInclude(),
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
