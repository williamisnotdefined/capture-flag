import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

@Injectable()
export class FeatureFlagEnvironmentValueInitializerService {
  async initialize(
    tx: Prisma.TransactionClient,
    {
      configId,
      defaultValue,
      featureFlagId,
      projectId,
      updatedByUserId,
    }: {
      configId: string;
      defaultValue: Prisma.InputJsonValue;
      featureFlagId: string;
      projectId: string;
      updatedByUserId: string;
    },
  ) {
    const environments = await tx.environment.findMany({
      where: { projectId },
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });

    const environmentIds = environments.map((environment) => environment.id);
    if (environmentIds.length === 0) {
      return environmentIds;
    }

    await tx.featureFlagEnvironmentValue.createMany({
      data: environmentIds.map((environmentId) => ({
        projectId,
        configId,
        featureFlagId,
        environmentId,
        defaultValue,
        rulesJson: [] as Prisma.InputJsonValue,
        percentageAttribute: "identifier",
        percentageOptionsJson: [] as Prisma.InputJsonValue,
        updatedByUserId,
      })),
    });

    return environmentIds;
  }
}
