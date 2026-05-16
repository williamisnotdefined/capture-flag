import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  type FeatureFlagType,
  isFeatureFlagType,
  normalizeJsonArray,
  normalizeRules,
} from "../../common/flag-values";

type RuleValidationClient = Pick<Prisma.TransactionClient, "featureFlag" | "segment">;

@Injectable()
export class FeatureFlagRulesService {
  async normalizeRulesJson(
    client: RuleValidationClient,
    flag: { configId: string; key: string },
    environmentId: string,
    type: FeatureFlagType,
    value: unknown,
  ) {
    const rawRules = normalizeJsonArray(value, "rulesJson");
    if (rawRules.length === 0) {
      return rawRules;
    }

    const [segments, flags] = await Promise.all([
      client.segment.findMany({
        where: {
          configId: flag.configId,
          deletedAt: null,
        },
        select: { key: true },
      }),
      client.featureFlag.findMany({
        where: {
          configId: flag.configId,
          deletedAt: null,
        },
        select: {
          key: true,
          type: true,
          environmentValues: {
            where: { environmentId },
            select: { rulesJson: true },
            take: 1,
          },
        },
      }),
    ]);

    const activeFlagTypes = new Map<string, FeatureFlagType>();
    for (const activeFlag of flags) {
      if (isFeatureFlagType(activeFlag.type)) {
        activeFlagTypes.set(activeFlag.key, activeFlag.type);
      }
    }

    const rules = normalizeRules(
      type,
      rawRules,
      new Set(segments.map((segment) => segment.key)),
      activeFlagTypes,
      flag.key,
    );

    this.ensurePrerequisiteGraphHasNoCycle(flag.key, rules, flags);

    return rules;
  }

  private ensurePrerequisiteGraphHasNoCycle(
    currentFlagKey: string,
    currentRules: unknown[],
    flags: Array<{
      key: string;
      environmentValues: Array<{ rulesJson: Prisma.JsonValue }>;
    }>,
  ) {
    const graph = new Map<string, string[]>();
    for (const flag of flags) {
      graph.set(
        flag.key,
        this.collectPrerequisiteFlagKeys(
          flag.key === currentFlagKey ? currentRules : (flag.environmentValues[0]?.rulesJson ?? []),
        ),
      );
    }

    const visited = new Set<string>();
    const path = new Set<string>();
    const hasCycle = (flagKey: string): boolean => {
      if (path.has(flagKey)) {
        return true;
      }

      if (visited.has(flagKey)) {
        return false;
      }

      visited.add(flagKey);
      path.add(flagKey);
      for (const prerequisiteFlagKey of graph.get(flagKey) ?? []) {
        if (graph.has(prerequisiteFlagKey) && hasCycle(prerequisiteFlagKey)) {
          return true;
        }
      }

      path.delete(flagKey);
      return false;
    };

    if (hasCycle(currentFlagKey)) {
      throw new BadRequestException("Prerequisite flags cannot contain cycles");
    }
  }

  private collectPrerequisiteFlagKeys(value: unknown) {
    const rules = Array.isArray(value) ? value : [];
    const keys: string[] = [];

    for (const rule of rules) {
      if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
        continue;
      }

      const conditions = (rule as Record<string, unknown>).conditions;
      if (!Array.isArray(conditions)) {
        continue;
      }

      for (const condition of conditions) {
        if (!condition || typeof condition !== "object" || Array.isArray(condition)) {
          continue;
        }

        const prerequisiteFlag = (condition as Record<string, unknown>).prerequisiteFlag;
        if (typeof prerequisiteFlag === "string" && prerequisiteFlag.trim()) {
          keys.push(prerequisiteFlag.trim());
        }
      }
    }

    return keys;
  }
}
