import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { toAuditJson } from "../../common/audit-log";
import { bumpConfigEnvironmentState } from "../../common/config-state";

@Injectable()
export class FeatureFlagConfigStateService {
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
}
