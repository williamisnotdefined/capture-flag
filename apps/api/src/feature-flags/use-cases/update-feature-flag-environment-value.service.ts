import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createAuditLog, toAuditJson } from "../../common/audit-log";
import { bumpConfigEnvironmentState } from "../../common/config-state";
import {
  type FeatureFlagType,
  defaultValueForFlagType,
  normalizeFlagDefaultValue,
  normalizePercentageAttribute,
  normalizePercentageOptions,
} from "../../common/flag-values";
import { PrismaService } from "../../prisma/prisma.service";
import {
  FeatureFlagAccessService,
  FeatureFlagAuditService,
  FeatureFlagPublicValueService,
  FeatureFlagRulesService,
  type PublicEnvironmentValueUpdate,
} from "../support";

export type UpdateFeatureFlagEnvironmentValueInput = {
  configId: string;
  environmentId: string;
  featureFlagId: string;
  input: {
    defaultValue?: unknown;
    percentageAttribute?: string;
    percentageOptionsJson?: unknown;
    rulesJson?: unknown;
  };
  userId: string;
};

@Injectable()
export class UpdateFeatureFlagEnvironmentValueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly featureFlagAccess: FeatureFlagAccessService,
    private readonly featureFlagAudit: FeatureFlagAuditService,
    private readonly featureFlagPublicValue: FeatureFlagPublicValueService,
    private readonly featureFlagRules: FeatureFlagRulesService,
  ) {}

  async execute({
    userId,
    configId,
    featureFlagId,
    environmentId,
    input,
  }: UpdateFeatureFlagEnvironmentValueInput) {
    const config = await this.featureFlagAccess.findConfigForWrite(userId, configId);
    const flag = await this.featureFlagAccess.findActiveFlag(configId, featureFlagId);

    const environment = await this.prisma.environment.findUnique({
      where: { id: environmentId },
      select: { id: true, projectId: true },
    });

    if (!environment || environment.projectId !== flag.projectId) {
      throw new BadRequestException("Environment does not belong to the flag project");
    }

    const type = flag.type as FeatureFlagType;
    const publicUpdate: PublicEnvironmentValueUpdate = {};
    const updateData: Prisma.FeatureFlagEnvironmentValueUncheckedUpdateInput = {
      updatedByUserId: userId,
    };
    const createData = {
      projectId: flag.projectId,
      configId: flag.configId,
      featureFlagId,
      environmentId,
      defaultValue: normalizeFlagDefaultValue(
        type,
        flag.initialDefaultValue ?? defaultValueForFlagType(type),
      ) as Prisma.InputJsonValue,
      rulesJson: [] as Prisma.InputJsonValue,
      percentageAttribute: "identifier",
      percentageOptionsJson: [] as Prisma.InputJsonValue,
      updatedByUserId: userId,
    };

    if (input.defaultValue !== undefined) {
      const defaultValue = normalizeFlagDefaultValue(type, input.defaultValue);
      const jsonValue = defaultValue as Prisma.InputJsonValue;
      publicUpdate.defaultValue = jsonValue;
      updateData.defaultValue = jsonValue;
      createData.defaultValue = jsonValue;
    }

    const rulesJsonInput = input.rulesJson;

    if (input.percentageAttribute !== undefined) {
      const percentageAttribute = normalizePercentageAttribute(input.percentageAttribute);
      publicUpdate.percentageAttribute = percentageAttribute;
      updateData.percentageAttribute = percentageAttribute;
      createData.percentageAttribute = percentageAttribute;
    }

    if (input.percentageOptionsJson !== undefined) {
      const percentageOptionsJson = normalizePercentageOptions(type, input.percentageOptionsJson);
      const jsonValue = percentageOptionsJson as Prisma.InputJsonValue;
      publicUpdate.percentageOptionsJson = jsonValue;
      updateData.percentageOptionsJson = jsonValue;
      createData.percentageOptionsJson = jsonValue;
    }

    if (Object.keys(publicUpdate).length === 0 && rulesJsonInput === undefined) {
      throw new BadRequestException("No feature flag value fields to update");
    }

    return this.prisma.$transaction(
      async (tx) => {
        if (rulesJsonInput !== undefined) {
          const rulesJson = await this.featureFlagRules.normalizeRulesJson(
            tx,
            flag,
            environmentId,
            type,
            rulesJsonInput,
          );
          const jsonValue = rulesJson as Prisma.InputJsonValue;
          publicUpdate.rulesJson = jsonValue;
          updateData.rulesJson = jsonValue;
          createData.rulesJson = jsonValue;
        }

        const existingValue = await tx.featureFlagEnvironmentValue.findUnique({
          where: {
            featureFlagId_environmentId: {
              featureFlagId,
              environmentId,
            },
          },
          include: {
            environment: {
              select: {
                id: true,
                key: true,
                name: true,
                sortOrder: true,
              },
            },
          },
        });

        if (
          existingValue &&
          !this.featureFlagPublicValue.hasPublicValueChange(existingValue, publicUpdate)
        ) {
          return existingValue;
        }

        const value = await tx.featureFlagEnvironmentValue.upsert({
          where: {
            featureFlagId_environmentId: {
              featureFlagId,
              environmentId,
            },
          },
          create: createData,
          update: updateData,
          include: {
            environment: {
              select: {
                id: true,
                key: true,
                name: true,
                sortOrder: true,
              },
            },
          },
        });

        await bumpConfigEnvironmentState(tx, flag.configId, environmentId, {
          actorUserId: userId,
          metadata: toAuditJson({ featureFlagId }),
          organizationId: config.project.organizationId,
          projectId: flag.projectId,
          sourceAction: "flag_value.updated",
          sourceEntityId: value.id,
          sourceEntityType: "feature_flag_environment_value",
        });

        await createAuditLog(tx, {
          action: "flag_value.updated",
          actorUserId: userId,
          configId: flag.configId,
          entityId: value.id,
          entityType: "feature_flag_environment_value",
          metadata: toAuditJson({
            environmentId,
            featureFlagId,
            ...this.featureFlagAudit.rulesAuditMetadata(existingValue?.rulesJson, value.rulesJson),
          }),
          newValue: this.featureFlagAudit.flagEnvironmentValueAuditValue(value),
          oldValue: existingValue
            ? this.featureFlagAudit.flagEnvironmentValueAuditValue(existingValue)
            : undefined,
          organizationId: config.project.organizationId,
          projectId: flag.projectId,
        });

        const rulesMetadata = this.featureFlagAudit.rulesAuditMetadata(
          existingValue?.rulesJson,
          value.rulesJson,
        );
        if (rulesMetadata.rulesAdded > 0) {
          await createAuditLog(tx, {
            action: "rule.added",
            actorUserId: userId,
            configId: flag.configId,
            entityId: value.id,
            entityType: "feature_flag_environment_value",
            metadata: toAuditJson({
              environmentId,
              featureFlagId,
              ...rulesMetadata,
            }),
            newValue: toAuditJson(value.rulesJson),
            oldValue: toAuditJson(existingValue?.rulesJson ?? []),
            organizationId: config.project.organizationId,
            projectId: flag.projectId,
          });
        }

        if (rulesMetadata.rulesRemoved > 0) {
          await createAuditLog(tx, {
            action: "rule.removed",
            actorUserId: userId,
            configId: flag.configId,
            entityId: value.id,
            entityType: "feature_flag_environment_value",
            metadata: toAuditJson({
              environmentId,
              featureFlagId,
              ...rulesMetadata,
            }),
            newValue: toAuditJson(value.rulesJson),
            oldValue: toAuditJson(existingValue?.rulesJson ?? []),
            organizationId: config.project.organizationId,
            projectId: flag.projectId,
          });
        }

        return value;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
