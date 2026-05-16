import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { toAuditJson } from "../../common/audit-log";
import { bumpConfigEnvironmentState } from "../../common/config-state";

@Injectable()
export class FeatureFlagConfigStateService {
  async bumpForFlagCreate(
    tx: Prisma.TransactionClient,
    {
      actorUserId,
      configId,
      environmentIds,
      featureFlagId,
      organizationId,
      projectId,
    }: {
      actorUserId: string;
      configId: string;
      environmentIds: string[];
      featureFlagId: string;
      organizationId: string;
      projectId: string;
    },
  ) {
    for (const environmentId of environmentIds) {
      await bumpConfigEnvironmentState(tx, configId, environmentId, {
        actorUserId,
        metadata: toAuditJson({ featureFlagId }),
        organizationId,
        projectId,
        sourceAction: "flag.created",
        sourceEntityId: featureFlagId,
        sourceEntityType: "feature_flag",
      });
    }

    return environmentIds;
  }

  async bumpForFlagUpdate(
    tx: Prisma.TransactionClient,
    {
      actorUserId,
      configId,
      featureFlagId,
      organizationId,
      projectId,
    }: {
      actorUserId: string;
      configId: string;
      featureFlagId: string;
      organizationId: string;
      projectId: string;
    },
  ) {
    const values = await tx.featureFlagEnvironmentValue.findMany({
      where: { featureFlagId },
      select: { environmentId: true },
    });
    const environmentIds = values.map((value) => value.environmentId);

    for (const environmentId of environmentIds) {
      await bumpConfigEnvironmentState(tx, configId, environmentId, {
        actorUserId,
        metadata: toAuditJson({ featureFlagId }),
        organizationId,
        projectId,
        sourceAction: "flag.updated",
        sourceEntityId: featureFlagId,
        sourceEntityType: "feature_flag",
      });
    }

    return environmentIds;
  }

  async bumpForFlagDelete(
    tx: Prisma.TransactionClient,
    {
      actorUserId,
      configId,
      featureFlagId,
      organizationId,
      projectId,
    }: {
      actorUserId: string;
      configId: string;
      featureFlagId: string;
      organizationId: string;
      projectId: string;
    },
  ) {
    const values = await tx.featureFlagEnvironmentValue.findMany({
      where: { featureFlagId },
      select: { environmentId: true },
    });
    const environmentIds = values.map((value) => value.environmentId);

    for (const environmentId of environmentIds) {
      await bumpConfigEnvironmentState(tx, configId, environmentId, {
        actorUserId,
        metadata: toAuditJson({ featureFlagId }),
        organizationId,
        projectId,
        sourceAction: "flag.deleted",
        sourceEntityId: featureFlagId,
        sourceEntityType: "feature_flag",
      });
    }

    return environmentIds;
  }
}
