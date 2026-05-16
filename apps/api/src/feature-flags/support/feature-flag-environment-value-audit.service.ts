import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createAuditLog, toAuditJson } from "../../common/audit-log";
import { FeatureFlagAuditService } from "./feature-flag-audit.service";
import type { FeatureFlagEnvironmentValueWithEnvironment } from "./feature-flag-environment-value-writer.service";

@Injectable()
export class FeatureFlagEnvironmentValueAuditService {
  constructor(private readonly featureFlagAudit: FeatureFlagAuditService) {}

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
    const rulesMetadata = this.featureFlagAudit.rulesAuditMetadata(
      existingValue?.rulesJson,
      value.rulesJson,
    );

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
      newValue: this.featureFlagAudit.flagEnvironmentValueAuditValue(value),
      oldValue: existingValue
        ? this.featureFlagAudit.flagEnvironmentValueAuditValue(existingValue)
        : undefined,
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
}
