import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { toAuditJson } from "../../common/audit-log";
import { bumpConfigEnvironmentState } from "../../common/config-state";
import type { FeatureFlagType } from "../../common/flag-values";
import { PrismaService } from "../../prisma/prisma.service";
import {
  FeatureFlagAccessService,
  FeatureFlagEnvironmentValueAuditService,
  FeatureFlagEnvironmentValueInputService,
  FeatureFlagEnvironmentValueWriterService,
  FeatureFlagRulesService,
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
    private readonly featureFlagEnvironmentValueAudit: FeatureFlagEnvironmentValueAuditService,
    private readonly featureFlagEnvironmentValueInput: FeatureFlagEnvironmentValueInputService,
    private readonly featureFlagEnvironmentValueWriter: FeatureFlagEnvironmentValueWriterService,
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

    const type = flag.type as FeatureFlagType;
    await this.featureFlagAccess.assertEnvironmentBelongsToFlagProject(
      environmentId,
      flag.projectId,
    );
    const normalizedInput = this.featureFlagEnvironmentValueInput.normalize({
      environmentId,
      featureFlagId,
      flag: { ...flag, type },
      input,
      userId,
    });

    return this.prisma.$transaction(
      async (tx) => {
        if (normalizedInput.rulesJsonInput !== undefined) {
          const rulesJson = await this.featureFlagRules.normalizeRulesJson(
            tx,
            flag,
            environmentId,
            type,
            normalizedInput.rulesJsonInput,
          );
          this.featureFlagEnvironmentValueInput.applyRulesJson(normalizedInput, rulesJson);
        }

        const writeResult = await this.featureFlagEnvironmentValueWriter.write(tx, {
          createData: normalizedInput.createData,
          environmentId,
          featureFlagId,
          publicUpdate: normalizedInput.publicUpdate,
          updateData: normalizedInput.updateData,
        });

        if (!writeResult.didChange) {
          return writeResult.value;
        }

        await bumpConfigEnvironmentState(tx, flag.configId, environmentId, {
          actorUserId: userId,
          metadata: toAuditJson({ featureFlagId }),
          organizationId: config.project.organizationId,
          projectId: flag.projectId,
          sourceAction: "flag_value.updated",
          sourceEntityId: writeResult.value.id,
          sourceEntityType: "feature_flag_environment_value",
        });

        await this.featureFlagEnvironmentValueAudit.writeUpdateLogs(tx, {
          actorUserId: userId,
          configId: flag.configId,
          environmentId,
          existingValue: writeResult.existingValue,
          featureFlagId,
          organizationId: config.project.organizationId,
          projectId: flag.projectId,
          value: writeResult.value,
        });

        return writeResult.value;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
