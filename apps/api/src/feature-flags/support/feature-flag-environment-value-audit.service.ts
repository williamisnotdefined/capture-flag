import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createAuditLog, toAuditJson } from "../../common/audit-log";
import type { FeatureFlagEnvironmentValueWithEnvironment } from "./feature-flag-environment-value-writer.service";

@Injectable()
export class FeatureFlagEnvironmentValueAuditService {
  async writeUpdateLogs(
    tx: Prisma.TransactionClient,
    {
      actorUserId,
      configId,
      environmentId,
      existingValue,
      featureFlagId,
      organizationId,
      projectId,
      value,
    }: {
      actorUserId: string;
      configId: string;
      environmentId: string;
      existingValue: FeatureFlagEnvironmentValueWithEnvironment | null;
      featureFlagId: string;
      organizationId: string;
      projectId: string;
      value: FeatureFlagEnvironmentValueWithEnvironment;
    },
  ) {
    const rulesMetadata = this.rulesAuditMetadata(existingValue?.rulesJson, value.rulesJson);

    await createAuditLog(tx, {
      action: "flag_value.updated",
      actorUserId,
      configId,
      entityId: value.id,
      entityType: "feature_flag_environment_value",
      metadata: toAuditJson({
        environmentId,
        featureFlagId,
        ...rulesMetadata,
      }),
      newValue: this.flagEnvironmentValueAuditValue(value),
      oldValue: existingValue ? this.flagEnvironmentValueAuditValue(existingValue) : undefined,
      organizationId,
      projectId,
    });

    if (rulesMetadata.rulesAdded > 0) {
      await createAuditLog(tx, {
        action: "rule.added",
        actorUserId,
        configId,
        entityId: value.id,
        entityType: "feature_flag_environment_value",
        metadata: toAuditJson({
          environmentId,
          featureFlagId,
          ...rulesMetadata,
        }),
        newValue: toAuditJson(value.rulesJson),
        oldValue: toAuditJson(existingValue?.rulesJson ?? []),
        organizationId,
        projectId,
      });
    }

    if (rulesMetadata.rulesRemoved > 0) {
      await createAuditLog(tx, {
        action: "rule.removed",
        actorUserId,
        configId,
        entityId: value.id,
        entityType: "feature_flag_environment_value",
        metadata: toAuditJson({
          environmentId,
          featureFlagId,
          ...rulesMetadata,
        }),
        newValue: toAuditJson(value.rulesJson),
        oldValue: toAuditJson(existingValue?.rulesJson ?? []),
        organizationId,
        projectId,
      });
    }
  }

  flagEnvironmentValueAuditValue(value: {
    configId: string;
    defaultValue: Prisma.JsonValue;
    environmentId: string;
    featureFlagId: string;
    id: string;
    percentageAttribute: string;
    percentageOptionsJson: Prisma.JsonValue;
    projectId: string;
    rulesJson: Prisma.JsonValue;
    updatedByUserId: string | null;
  }) {
    return toAuditJson({
      configId: value.configId,
      defaultValue: value.defaultValue,
      environmentId: value.environmentId,
      featureFlagId: value.featureFlagId,
      id: value.id,
      percentageAttribute: value.percentageAttribute,
      percentageOptionsJson: value.percentageOptionsJson,
      projectId: value.projectId,
      rulesJson: value.rulesJson,
      updatedByUserId: value.updatedByUserId,
    });
  }

  rulesAuditMetadata(oldRulesValue: Prisma.JsonValue | undefined, newRulesValue: Prisma.JsonValue) {
    const oldRuleCount = Array.isArray(oldRulesValue) ? oldRulesValue.length : 0;
    const newRuleCount = Array.isArray(newRulesValue) ? newRulesValue.length : 0;

    return {
      newRuleCount,
      oldRuleCount,
      rulesAdded: Math.max(newRuleCount - oldRuleCount, 0),
      rulesChanged: JSON.stringify(oldRulesValue ?? []) !== JSON.stringify(newRulesValue),
      rulesRemoved: Math.max(oldRuleCount - newRuleCount, 0),
    };
  }
}
