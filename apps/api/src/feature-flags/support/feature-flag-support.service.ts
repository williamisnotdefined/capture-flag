import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AccessService } from "../../common/access.service";
import { toAuditJson } from "../../common/audit-log";
import {
  type FeatureFlagType,
  isFeatureFlagType,
  normalizeJsonArray,
  normalizeRules,
  rulesJsonReferencesPrerequisiteFlag,
} from "../../common/flag-values";
import { featureFlagManagerRoles } from "../../common/roles";
import { PrismaService } from "../../prisma/prisma.service";

const flagKeyPattern = /^[A-Za-z][A-Za-z0-9_.-]*$/;

export type PublicEnvironmentValueUpdate = {
  defaultValue?: Prisma.InputJsonValue;
  rulesJson?: Prisma.InputJsonValue;
  percentageAttribute?: string;
  percentageOptionsJson?: Prisma.InputJsonValue;
};

type RuleValidationClient = Pick<Prisma.TransactionClient, "featureFlag" | "segment">;
type FlagReferenceClient = Pick<Prisma.TransactionClient, "featureFlagEnvironmentValue">;

@Injectable()
export class FeatureFlagSupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  featureFlagAuditValue(flag: {
    configId: string;
    deletedAt?: Date | null;
    description: string | null;
    hint: string | null;
    id: string;
    initialDefaultValue?: Prisma.JsonValue | null;
    key: string;
    name: string;
    ownerUserId: string | null;
    projectId: string;
    tags: string[];
    type: string;
  }) {
    return toAuditJson({
      configId: flag.configId,
      deletedAt: flag.deletedAt?.toISOString() ?? null,
      description: flag.description,
      hint: flag.hint,
      id: flag.id,
      initialDefaultValue: flag.initialDefaultValue ?? null,
      key: flag.key,
      name: flag.name,
      ownerUserId: flag.ownerUserId,
      projectId: flag.projectId,
      tags: flag.tags,
      type: flag.type,
    });
  }

  flagEnvironmentValueAuditValue(value: {
    configId: string;
    defaultValue: Prisma.JsonValue;
    environmentId: string;
    featureFlagId: string;
    id: string;
    percentageAttribute: string;
    percentageOptionsJson: Prisma.JsonValue;
    projectId: string;
    rulesJson: Prisma.JsonValue;
    updatedByUserId: string | null;
  }) {
    return toAuditJson({
      configId: value.configId,
      defaultValue: value.defaultValue,
      environmentId: value.environmentId,
      featureFlagId: value.featureFlagId,
      id: value.id,
      percentageAttribute: value.percentageAttribute,
      percentageOptionsJson: value.percentageOptionsJson,
      projectId: value.projectId,
      rulesJson: value.rulesJson,
      updatedByUserId: value.updatedByUserId,
    });
  }

  hasPublicValueChange(
    existingValue: {
      defaultValue: Prisma.JsonValue;
      rulesJson: Prisma.JsonValue;
      percentageAttribute: string;
      percentageOptionsJson: Prisma.JsonValue;
    },
    update: PublicEnvironmentValueUpdate,
  ) {
    if (
      update.defaultValue !== undefined &&
      !this.jsonValuesEqual(existingValue.defaultValue, update.defaultValue)
    ) {
      return true;
    }

    if (
      update.rulesJson !== undefined &&
      !this.jsonValuesEqual(existingValue.rulesJson, update.rulesJson)
    ) {
      return true;
    }

    if (
      update.percentageAttribute !== undefined &&
      existingValue.percentageAttribute !== update.percentageAttribute
    ) {
      return true;
    }

    if (
      update.percentageOptionsJson !== undefined &&
      !this.jsonValuesEqual(existingValue.percentageOptionsJson, update.percentageOptionsJson)
    ) {
      return true;
    }

    return false;
  }

  jsonValuesEqual(left: unknown, right: unknown): boolean {
    if (left === right) {
      return true;
    }

    if (Array.isArray(left) || Array.isArray(right)) {
      if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
        return false;
      }

      return left.every((item, index) => this.jsonValuesEqual(item, right[index]));
    }

    if (this.isJsonObject(left) || this.isJsonObject(right)) {
      if (!this.isJsonObject(left) || !this.isJsonObject(right)) {
        return false;
      }

      const leftKeys = Object.keys(left);
      const rightKeys = Object.keys(right);
      if (leftKeys.length !== rightKeys.length) {
        return false;
      }

      return leftKeys.every(
        (key) =>
          Object.prototype.hasOwnProperty.call(right, key) &&
          this.jsonValuesEqual(left[key], right[key]),
      );
    }

    return false;
  }

  rulesAuditMetadata(oldRulesValue: Prisma.JsonValue | undefined, newRulesValue: Prisma.JsonValue) {
    const oldRuleCount = Array.isArray(oldRulesValue) ? oldRulesValue.length : 0;
    const newRuleCount = Array.isArray(newRulesValue) ? newRulesValue.length : 0;

    return {
      newRuleCount,
      oldRuleCount,
      rulesAdded: Math.max(newRuleCount - oldRuleCount, 0),
      rulesChanged: JSON.stringify(oldRulesValue ?? []) !== JSON.stringify(newRulesValue),
      rulesRemoved: Math.max(oldRuleCount - newRuleCount, 0),
    };
  }

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

  async ensureFlagIsNotReferenced(
    client: FlagReferenceClient,
    configId: string,
    flagKey: string,
    action: "delete" | "rename",
  ) {
    const values = await client.featureFlagEnvironmentValue.findMany({
      where: {
        configId,
        featureFlag: {
          deletedAt: null,
        },
      },
      select: {
        environment: {
          select: {
            key: true,
          },
        },
        featureFlag: {
          select: {
            key: true,
          },
        },
        rulesJson: true,
      },
    });

    const references = values.filter((value) =>
      rulesJsonReferencesPrerequisiteFlag(value.rulesJson, flagKey),
    );
    if (references.length === 0) {
      return;
    }

    const firstReference = references[0];
    throw new BadRequestException(
      `Cannot ${action} flag while it is referenced as prerequisite by ${firstReference.featureFlag.key} in ${firstReference.environment.key}`,
    );
  }

  featureFlagInclude() {
    return {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      environmentValues: {
        include: {
          environment: {
            select: {
              id: true,
              key: true,
              name: true,
              sortOrder: true,
            },
          },
        },
        orderBy: { createdAt: "asc" as const },
      },
    };
  }

  async findConfigForWrite(userId: string, configId: string) {
    const config = await this.prisma.config.findUnique({
      where: { id: configId },
      include: {
        project: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (!config) {
      throw new NotFoundException("Config not found");
    }

    await this.access.requireProjectRole(userId, config.projectId, featureFlagManagerRoles);
    return config;
  }

  async findActiveFlag(configId: string, featureFlagId: string) {
    const flag = await this.prisma.featureFlag.findFirst({
      where: {
        configId,
        id: featureFlagId,
        deletedAt: null,
      },
    });

    if (!flag) {
      throw new NotFoundException("Feature flag not found");
    }

    if (!isFeatureFlagType(flag.type)) {
      throw new BadRequestException("Feature flag has an invalid type");
    }

    return flag;
  }

  normalizeFlagKey(value: string | undefined) {
    const key = value?.trim();
    if (!key) {
      throw new BadRequestException("Flag key is required");
    }

    if (!flagKeyPattern.test(key)) {
      throw new BadRequestException(
        "Flag key must start with a letter and contain only letters, numbers, dots, underscores or hyphens",
      );
    }

    return key;
  }

  async normalizeOwnerUserId(ownerUserId: string | null | undefined, organizationId: string) {
    if (!ownerUserId) {
      return null;
    }

    await this.access.requireOrganizationMember(ownerUserId, organizationId);
    return ownerUserId;
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

  private isJsonObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
}
