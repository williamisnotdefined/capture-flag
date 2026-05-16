import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  type FeatureFlagType,
  defaultValueForFlagType,
  isFeatureFlagType,
  normalizeFlagDefaultValue,
} from "../common/flag-values";
import type {
  PublicConfigBody,
  PublicConfigBuildInput,
  PublicConfigFlag,
  PublicConfigSegment,
} from "./public-config.types";

@Injectable()
export class PublicConfigBuilderService {
  async buildConfigBody(
    tx: Prisma.TransactionClient,
    input: PublicConfigBuildInput,
  ): Promise<PublicConfigBody> {
    const featureFlags = await tx.featureFlag.findMany({
      where: {
        configId: input.configId,
        deletedAt: null,
      },
      include: {
        environmentValues: {
          where: { environmentId: input.environmentId },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          take: 1,
        },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    const segments = await tx.segment.findMany({
      where: {
        configId: input.configId,
        deletedAt: null,
      },
      orderBy: [{ key: "asc" }, { id: "asc" }],
    });

    const flags = featureFlags.reduce<Record<string, PublicConfigFlag>>((accumulator, flag) => {
      const value = flag.environmentValues[0];
      const type = this.normalizeFeatureFlagType(flag.type);

      accumulator[flag.key] = {
        type,
        defaultValue: value
          ? value.defaultValue
          : (normalizeFlagDefaultValue(
              type,
              flag.initialDefaultValue ?? defaultValueForFlagType(type),
            ) as Prisma.JsonValue),
        rules: value ? this.asJsonArray(value.rulesJson) : [],
        percentageAttribute: value?.percentageAttribute ?? "identifier",
        percentageOptions: value ? this.asJsonArray(value.percentageOptionsJson) : [],
      };

      return accumulator;
    }, {});
    const publicSegments = segments.reduce<Record<string, PublicConfigSegment>>(
      (accumulator, segment) => {
        accumulator[segment.key] = {
          conditions: this.asJsonArray(segment.conditionsJson),
        };

        return accumulator;
      },
      {},
    );

    return {
      schemaVersion: 1,
      projectKey: input.projectKey,
      configKey: input.configKey,
      environment: input.environmentKey,
      revision: input.revision,
      generatedAt: input.generatedAt.toISOString(),
      segments: publicSegments,
      flags,
    };
  }

  private asJsonArray(value: Prisma.JsonValue) {
    if (!Array.isArray(value)) {
      throw new InternalServerErrorException("Public config contains an invalid JSON array");
    }

    return value;
  }

  private normalizeFeatureFlagType(value: string): FeatureFlagType {
    if (!isFeatureFlagType(value)) {
      throw new InternalServerErrorException("Public config contains an invalid flag type");
    }

    return value;
  }
}
