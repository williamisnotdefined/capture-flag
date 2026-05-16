import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createAuditLog, toAuditJson } from "../../common/audit-log";

type FeatureFlagAuditValue = {
  configId: string;
  deletedAt?: Date | null;
  description: string | null;
  hint: string | null;
  id: string;
  initialDefaultValue?: Prisma.JsonValue | null;
  key: string;
  name: string;
  ownerUserId: string | null;
  projectId: string;
  tags: string[];
  type: string;
};

@Injectable()
export class FeatureFlagAuditService {
  featureFlagAuditValue(flag: FeatureFlagAuditValue) {
    return toAuditJson({
      configId: flag.configId,
      deletedAt: flag.deletedAt?.toISOString() ?? null,
      description: flag.description,
      hint: flag.hint,
      id: flag.id,
      initialDefaultValue: flag.initialDefaultValue ?? null,
      key: flag.key,
      name: flag.name,
      ownerUserId: flag.ownerUserId,
      projectId: flag.projectId,
      tags: flag.tags,
      type: flag.type,
    });
  }

  async writeFlagUpdated(
    tx: Prisma.TransactionClient,
    {
      actorUserId,
      changedFields,
      currentFlag,
      environmentIds,
      organizationId,
      publicChanged,
      updatedFlag,
    }: {
      actorUserId: string;
      changedFields: string[];
      currentFlag: FeatureFlagAuditValue;
      environmentIds: string[];
      organizationId: string;
      publicChanged: boolean;
      updatedFlag: FeatureFlagAuditValue;
    },
  ) {
    await createAuditLog(tx, {
      action: "flag.updated",
      actorUserId,
      configId: currentFlag.configId,
      entityId: updatedFlag.id,
      entityType: "feature_flag",
      metadata: toAuditJson({
        changedFields,
        environmentIds,
        publicChanged,
      }),
      newValue: this.featureFlagAuditValue(updatedFlag),
      oldValue: this.featureFlagAuditValue(currentFlag),
      organizationId,
      projectId: currentFlag.projectId,
    });
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
