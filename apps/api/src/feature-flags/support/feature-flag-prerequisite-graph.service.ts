import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

export type FeatureFlagPrerequisiteGraphFlag = {
  key: string;
  environmentValues: Array<{ rulesJson: Prisma.JsonValue }>;
};

@Injectable()
export class FeatureFlagPrerequisiteGraphService {
  ensurePrerequisiteGraphHasNoCycle(
    currentFlagKey: string,
    currentRules: unknown[],
    flags: FeatureFlagPrerequisiteGraphFlag[],
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
