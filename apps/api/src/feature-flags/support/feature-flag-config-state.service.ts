import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { toAuditJson } from "../../common/audit-log";
import { bumpConfigEnvironmentState } from "../../common/config-state";

type FeatureFlagConfigStateAction = "flag.created" | "flag.updated" | "flag.deleted";

type FeatureFlagConfigStateBumpInput = {
  actorUserId: string;
  configId: string;
  featureFlagId: string;
  organizationId: string;
  projectId: string;
};

type FeatureFlagConfigStateBumpWithEnvironmentsInput = FeatureFlagConfigStateBumpInput & {
  environmentIds: string[];
};

@Injectable()
export class FeatureFlagConfigStateService {
  async bumpForFlagCreate(
    tx: Prisma.TransactionClient,
    input: FeatureFlagConfigStateBumpWithEnvironmentsInput,
  ) {
    return this.bumpFeatureFlagEnvironmentStates(tx, "flag.created", input);
  }

  async bumpForFlagUpdate(
    tx: Prisma.TransactionClient,
    input: FeatureFlagConfigStateBumpInput,
  ) {
    return this.bumpExistingFeatureFlagEnvironmentStates(tx, "flag.updated", input);
  }

  async bumpForFlagDelete(
    tx: Prisma.TransactionClient,
    input: FeatureFlagConfigStateBumpInput,
  ) {
    return this.bumpExistingFeatureFlagEnvironmentStates(tx, "flag.deleted", input);
  }

  private async bumpExistingFeatureFlagEnvironmentStates(
    tx: Prisma.TransactionClient,
    action: FeatureFlagConfigStateAction,
    input: FeatureFlagConfigStateBumpInput,
  ) {
    const environmentIds = await this.findFeatureFlagEnvironmentIds(tx, input.featureFlagId);

    return this.bumpFeatureFlagEnvironmentStates(tx, action, {
      ...input,
      environmentIds,
    });
  }

  private async findFeatureFlagEnvironmentIds(
    tx: Prisma.TransactionClient,
    featureFlagId: string,
  ) {
    const values = await tx.featureFlagEnvironmentValue.findMany({
      where: { featureFlagId },
      select: { environmentId: true },
    });

    return values.map((value) => value.environmentId);
  }

  private async bumpFeatureFlagEnvironmentStates(
    tx: Prisma.TransactionClient,
    action: FeatureFlagConfigStateAction,
    {
      actorUserId,
      configId,
      environmentIds,
      featureFlagId,
      organizationId,
      projectId,
    }: FeatureFlagConfigStateBumpWithEnvironmentsInput,
  ) {
    const audit = {
      actorUserId,
      metadata: toAuditJson({ featureFlagId }),
      organizationId,
      projectId,
      sourceAction: action,
      sourceEntityId: featureFlagId,
      sourceEntityType: "feature_flag",
    };

    for (const environmentId of environmentIds) {
      await bumpConfigEnvironmentState(tx, configId, environmentId, {
        ...audit,
      });
    }

    return environmentIds;
  }
}
