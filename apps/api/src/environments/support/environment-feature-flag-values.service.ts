import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  type FeatureFlagType,
  defaultValueForFlagType,
  isFeatureFlagType,
  normalizeFlagDefaultValue,
} from "../../common/flag-values";

@Injectable()
export class EnvironmentFeatureFlagValuesService {
  async createInitialValuesForEnvironment(
    tx: Prisma.TransactionClient,
    input: {
      environmentId: string;
      projectId: string;
      userId: string;
    },
  ) {
    const flags = await tx.featureFlag.findMany({
      where: {
        projectId: input.projectId,
        deletedAt: null,
      },
      select: {
        id: true,
        configId: true,
        initialDefaultValue: true,
        type: true,
      },
    });

    const validFlags: Array<{
      id: string;
      configId: string;
      initialDefaultValue: Prisma.JsonValue | null;
      type: FeatureFlagType;
    }> = flags.flatMap((flag) =>
      isFeatureFlagType(flag.type) ? [{ ...flag, type: flag.type }] : [],
    );

    if (validFlags.length > 0) {
      await tx.featureFlagEnvironmentValue.createMany({
        data: validFlags.map((flag) => ({
          projectId: input.projectId,
          configId: flag.configId,
          featureFlagId: flag.id,
          environmentId: input.environmentId,
          defaultValue: normalizeFlagDefaultValue(
            flag.type,
            flag.initialDefaultValue ?? defaultValueForFlagType(flag.type),
          ) as Prisma.InputJsonValue,
          rulesJson: [] as Prisma.InputJsonValue,
          percentageAttribute: "identifier",
          percentageOptionsJson: [] as Prisma.InputJsonValue,
          updatedByUserId: input.userId,
        })),
      });
    }

    return validFlags;
  }
}
