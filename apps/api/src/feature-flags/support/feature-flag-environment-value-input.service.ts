import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  type FeatureFlagType,
  defaultValueForFlagType,
  normalizeFlagDefaultValue,
  normalizePercentageAttribute,
  normalizePercentageOptions,
} from "../../common/flag-values";
import type { PublicEnvironmentValueUpdate } from "./feature-flag-public-value.service";

export type FeatureFlagEnvironmentValueInput = {
  defaultValue?: unknown;
  percentageAttribute?: string;
  percentageOptionsJson?: unknown;
  rulesJson?: unknown;
};

export type NormalizedFeatureFlagEnvironmentValueInput = {
  createData: Prisma.FeatureFlagEnvironmentValueUncheckedCreateInput;
  publicUpdate: PublicEnvironmentValueUpdate;
  rulesJsonInput: unknown;
  updateData: Prisma.FeatureFlagEnvironmentValueUncheckedUpdateInput;
};

@Injectable()
export class FeatureFlagEnvironmentValueInputService {
  normalize({
    environmentId,
    featureFlagId,
    flag,
    input,
    userId,
  }: {
    environmentId: string;
    featureFlagId: string;
    flag: {
      configId: string;
      initialDefaultValue: Prisma.JsonValue | null;
      projectId: string;
      type: FeatureFlagType;
    };
    input: FeatureFlagEnvironmentValueInput;
    userId: string;
  }): NormalizedFeatureFlagEnvironmentValueInput {
    const publicUpdate: PublicEnvironmentValueUpdate = {};
    const updateData: Prisma.FeatureFlagEnvironmentValueUncheckedUpdateInput = {
      updatedByUserId: userId,
    };
    const createData: Prisma.FeatureFlagEnvironmentValueUncheckedCreateInput = {
      projectId: flag.projectId,
      configId: flag.configId,
      featureFlagId,
      environmentId,
      defaultValue: normalizeFlagDefaultValue(
        flag.type,
        flag.initialDefaultValue ?? defaultValueForFlagType(flag.type),
      ) as Prisma.InputJsonValue,
      rulesJson: [] as Prisma.InputJsonValue,
      percentageAttribute: "identifier",
      percentageOptionsJson: [] as Prisma.InputJsonValue,
      updatedByUserId: userId,
    };

    if (input.defaultValue !== undefined) {
      const defaultValue = normalizeFlagDefaultValue(flag.type, input.defaultValue);
      const jsonValue = defaultValue as Prisma.InputJsonValue;
      publicUpdate.defaultValue = jsonValue;
      updateData.defaultValue = jsonValue;
      createData.defaultValue = jsonValue;
    }

    const rulesJsonInput = input.rulesJson;

    if (input.percentageAttribute !== undefined) {
      const percentageAttribute = normalizePercentageAttribute(input.percentageAttribute);
      publicUpdate.percentageAttribute = percentageAttribute;
      updateData.percentageAttribute = percentageAttribute;
      createData.percentageAttribute = percentageAttribute;
    }

    if (input.percentageOptionsJson !== undefined) {
      const percentageOptionsJson = normalizePercentageOptions(
        flag.type,
        input.percentageOptionsJson,
      );
      const jsonValue = percentageOptionsJson as Prisma.InputJsonValue;
      publicUpdate.percentageOptionsJson = jsonValue;
      updateData.percentageOptionsJson = jsonValue;
      createData.percentageOptionsJson = jsonValue;
    }

    if (Object.keys(publicUpdate).length === 0 && rulesJsonInput === undefined) {
      throw new BadRequestException("No feature flag value fields to update");
    }

    return {
      createData,
      publicUpdate,
      rulesJsonInput,
      updateData,
    };
  }

  applyRulesJson(input: NormalizedFeatureFlagEnvironmentValueInput, rulesJson: unknown[]) {
    const jsonValue = rulesJson as Prisma.InputJsonValue;
    input.publicUpdate.rulesJson = jsonValue;
    input.updateData.rulesJson = jsonValue;
    input.createData.rulesJson = jsonValue;
  }
}
