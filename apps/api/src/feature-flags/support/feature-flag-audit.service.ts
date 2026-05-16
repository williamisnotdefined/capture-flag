import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { toAuditJson } from "../../common/audit-log";

@Injectable()
export class FeatureFlagAuditService {
  featureFlagAuditValue(flag: {
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
  }) {
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
