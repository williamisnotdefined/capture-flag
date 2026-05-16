import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createAuditLog, toAuditJson } from "../../common/audit-log";
import { bumpConfigEnvironmentState } from "../../common/config-state";
import { normalizeTags } from "../../common/flag-values";
import { PrismaService } from "../../prisma/prisma.service";
import {
  FeatureFlagAccessService,
  FeatureFlagAuditService,
  FeatureFlagReferenceService,
  featureFlagInclude,
} from "../support";

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
    private readonly featureFlagAccess: FeatureFlagAccessService,
    private readonly featureFlagAudit: FeatureFlagAuditService,
    private readonly featureFlagReference: FeatureFlagReferenceService,
  ) {}

  async execute({ userId, configId, featureFlagId, input }: UpdateFeatureFlagInput) {
    const config = await this.featureFlagAccess.findConfigForWrite(userId, configId);
    const flag = await this.featureFlagAccess.findActiveFlag(configId, featureFlagId);

    const data: Prisma.FeatureFlagUncheckedUpdateInput = {};
    let receivedAnyField = false;

    if (input.key !== undefined) {
      receivedAnyField = true;
      const key = this.featureFlagAccess.normalizeFlagKey(input.key);
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
      const ownerUserId = await this.featureFlagAccess.normalizeOwnerUserId(
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

        if (Object.prototype.hasOwnProperty.call(data, "key")) {
          await this.featureFlagReference.ensureFlagIsNotReferenced(
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
          newValue: this.featureFlagAudit.featureFlagAuditValue(updatedFlag),
          oldValue: this.featureFlagAudit.featureFlagAuditValue(currentFlag),
          organizationId: config.project.organizationId,
          projectId: currentFlag.projectId,
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
