import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AccessService } from "../common/access.service";
import { createAuditLog, toAuditJson } from "../common/audit-log";
import { bumpConfigEnvironmentState } from "../common/config-state";
import {
  type FeatureFlagType,
  defaultValueForFlagType,
  isFeatureFlagType,
  normalizeFlagDefaultValue,
  normalizeJsonArray,
  normalizePercentageAttribute,
  normalizePercentageOptions,
  normalizeRules,
  normalizeTags,
  rulesJsonReferencesPrerequisiteFlag,
} from "../common/flag-values";
import { featureFlagManagerRoles } from "../common/roles";
import { PrismaService } from "../prisma/prisma.service";

const flagKeyPattern = /^[A-Za-z][A-Za-z0-9_.-]*$/;

type PublicEnvironmentValueUpdate = {
  defaultValue?: Prisma.InputJsonValue;
  rulesJson?: Prisma.InputJsonValue;
  percentageAttribute?: string;
  percentageOptionsJson?: Prisma.InputJsonValue;
};

type RuleValidationClient = Pick<Prisma.TransactionClient, "featureFlag" | "segment">;
type FlagReferenceClient = Pick<Prisma.TransactionClient, "featureFlagEnvironmentValue">;

@Injectable()
export class FeatureFlagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async list(userId: string, configId: string) {
    const config = await this.prisma.config.findUnique({
      where: { id: configId },
      select: { projectId: true },
    });

    if (!config) {
      throw new NotFoundException("Config not found");
    }

    await this.access.requireProjectAccess(userId, config.projectId);

    return this.prisma.featureFlag.findMany({
      where: {
        configId,
        deletedAt: null,
      },
      include: this.featureFlagInclude(),
      orderBy: { createdAt: "asc" },
    });
  }

  async create(
    userId: string,
    configId: string,
    input: {
      key?: string;
      name?: string;
      description?: string;
      type?: string;
      defaultValue?: unknown;
      tags?: unknown;
      hint?: string;
      ownerUserId?: string | null;
    },
  ) {
    const config = await this.prisma.config.findUnique({
      where: { id: configId },
      include: {
        project: {
          select: {
            id: true,
            organizationId: true,
          },
        },
      },
    });

    if (!config) {
      throw new NotFoundException("Config not found");
    }

    await this.access.requireProjectRole(userId, config.projectId, featureFlagManagerRoles);

    const key = this.normalizeFlagKey(input.key);
    const name = input.name?.trim();
    if (!name) {
      throw new BadRequestException("Flag name is required");
    }

    if (!isFeatureFlagType(input.type)) {
      throw new BadRequestException("Valid flag type is required");
    }
    const type = input.type;
    const defaultValue = normalizeFlagDefaultValue(
      type,
      input.defaultValue === undefined ? defaultValueForFlagType(type) : input.defaultValue,
    );
    const tags = normalizeTags(input.tags);
    const ownerUserId = await this.normalizeOwnerUserId(
      input.ownerUserId,
      config.project.organizationId,
    );

    return this.prisma.$transaction(async (tx) => {
      const flag = await tx.featureFlag.create({
        data: {
          projectId: config.projectId,
          configId,
          key,
          name,
          description: input.description?.trim() || null,
          type,
          initialDefaultValue: defaultValue as Prisma.InputJsonValue,
          tags,
          hint: input.hint?.trim() || null,
          ownerUserId,
        },
      });

      const environments = await tx.environment.findMany({
        where: { projectId: config.projectId },
        orderBy: { sortOrder: "asc" },
        select: { id: true },
      });

      if (environments.length > 0) {
        await tx.featureFlagEnvironmentValue.createMany({
          data: environments.map((environment) => ({
            projectId: config.projectId,
            configId,
            featureFlagId: flag.id,
            environmentId: environment.id,
            defaultValue: defaultValue as Prisma.InputJsonValue,
            rulesJson: [] as Prisma.InputJsonValue,
            percentageAttribute: "identifier",
            percentageOptionsJson: [] as Prisma.InputJsonValue,
            updatedByUserId: userId,
          })),
        });

        for (const environment of environments) {
          await bumpConfigEnvironmentState(tx, configId, environment.id, {
            actorUserId: userId,
            metadata: toAuditJson({ featureFlagId: flag.id }),
            organizationId: config.project.organizationId,
            projectId: config.projectId,
            sourceAction: "flag.created",
            sourceEntityId: flag.id,
            sourceEntityType: "feature_flag",
          });
        }
      }

      await createAuditLog(tx, {
        action: "flag.created",
        actorUserId: userId,
        configId,
        entityId: flag.id,
        entityType: "feature_flag",
        metadata: toAuditJson({
          environmentIds: environments.map((environment) => environment.id),
        }),
        newValue: this.featureFlagAuditValue(flag),
        organizationId: config.project.organizationId,
        projectId: config.projectId,
      });

      return tx.featureFlag.findUnique({
        where: { id: flag.id },
        include: this.featureFlagInclude(),
      });
    });
  }

  async update(
    userId: string,
    configId: string,
    featureFlagId: string,
    input: {
      key?: string;
      name?: string;
      description?: string;
      tags?: unknown;
      hint?: string;
      ownerUserId?: string | null;
    },
  ) {
    const config = await this.findConfigForWrite(userId, configId);
    const flag = await this.findActiveFlag(configId, featureFlagId);

    const data: Prisma.FeatureFlagUncheckedUpdateInput = {};
    let receivedAnyField = false;

    if (input.key !== undefined) {
      receivedAnyField = true;
      const key = this.normalizeFlagKey(input.key);
      if (key !== flag.key) {
        data.key = key;
      }
    }

    if (input.name !== undefined) {
      receivedAnyField = true;
      const name = input.name.trim();
      if (!name) {
        throw new BadRequestException("Flag name is required");
      }
      if (name !== flag.name) {
        data.name = name;
      }
    }

    if (input.description !== undefined) {
      receivedAnyField = true;
      const description = input.description.trim() || null;
      if (description !== flag.description) {
        data.description = description;
      }
    }

    if (input.tags !== undefined) {
      receivedAnyField = true;
      const tags = normalizeTags(input.tags);
      if (JSON.stringify(tags) !== JSON.stringify(flag.tags)) {
        data.tags = tags;
      }
    }

    if (input.hint !== undefined) {
      receivedAnyField = true;
      const hint = input.hint.trim() || null;
      if (hint !== flag.hint) {
        data.hint = hint;
      }
    }

    if (input.ownerUserId !== undefined) {
      receivedAnyField = true;
      const ownerUserId = await this.normalizeOwnerUserId(
        input.ownerUserId,
        config.project.organizationId,
      );
      if (ownerUserId !== flag.ownerUserId) {
        data.ownerUserId = ownerUserId;
      }
    }

    if (!receivedAnyField) {
      throw new BadRequestException("No feature flag fields to update");
    }

    if (Object.keys(data).length === 0) {
      return this.prisma.featureFlag.findUnique({
        where: { id: featureFlagId },
        include: this.featureFlagInclude(),
      });
    }

    return this.prisma.$transaction(
      async (tx) => {
        const currentFlag = await tx.featureFlag.findFirst({
          where: {
            configId,
            id: featureFlagId,
            deletedAt: null,
          },
        });
        if (!currentFlag) {
          throw new NotFoundException("Feature flag not found");
        }

        if (Object.prototype.hasOwnProperty.call(data, "key")) {
          await this.ensureFlagIsNotReferenced(tx, currentFlag.configId, currentFlag.key, "rename");
        }

        const updatedFlag = await tx.featureFlag.update({
          where: { id: featureFlagId },
          data,
        });

        const publicChanged = Object.prototype.hasOwnProperty.call(data, "key");
        const values = publicChanged
          ? await tx.featureFlagEnvironmentValue.findMany({
              where: { featureFlagId },
              select: { environmentId: true },
            })
          : [];

        for (const value of values) {
          await bumpConfigEnvironmentState(tx, currentFlag.configId, value.environmentId, {
            actorUserId: userId,
            metadata: toAuditJson({ featureFlagId }),
            organizationId: config.project.organizationId,
            projectId: currentFlag.projectId,
            sourceAction: "flag.updated",
            sourceEntityId: featureFlagId,
            sourceEntityType: "feature_flag",
          });
        }

        await createAuditLog(tx, {
          action: "flag.updated",
          actorUserId: userId,
          configId: currentFlag.configId,
          entityId: featureFlagId,
          entityType: "feature_flag",
          metadata: toAuditJson({
            changedFields: Object.keys(data),
            environmentIds: values.map((value) => value.environmentId),
            publicChanged,
          }),
          newValue: this.featureFlagAuditValue(updatedFlag),
          oldValue: this.featureFlagAuditValue(currentFlag),
          organizationId: config.project.organizationId,
          projectId: currentFlag.projectId,
        });

        return tx.featureFlag.findUnique({
          where: { id: featureFlagId },
          include: this.featureFlagInclude(),
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async delete(userId: string, configId: string, featureFlagId: string) {
    const config = await this.findConfigForWrite(userId, configId);

    await this.prisma.$transaction(
      async (tx) => {
        const currentFlag = await tx.featureFlag.findFirst({
          where: {
            configId,
            id: featureFlagId,
            deletedAt: null,
          },
        });
        if (!currentFlag) {
          throw new NotFoundException("Feature flag not found");
        }

        await this.ensureFlagIsNotReferenced(tx, currentFlag.configId, currentFlag.key, "delete");

        const deletedFlag = await tx.featureFlag.update({
          where: { id: featureFlagId },
          data: { deletedAt: new Date() },
        });

        const values = await tx.featureFlagEnvironmentValue.findMany({
          where: { featureFlagId },
          select: { environmentId: true },
        });

        for (const value of values) {
          await bumpConfigEnvironmentState(tx, currentFlag.configId, value.environmentId, {
            actorUserId: userId,
            metadata: toAuditJson({ featureFlagId }),
            organizationId: config.project.organizationId,
            projectId: currentFlag.projectId,
            sourceAction: "flag.deleted",
            sourceEntityId: featureFlagId,
            sourceEntityType: "feature_flag",
          });
        }

        await createAuditLog(tx, {
          action: "flag.deleted",
          actorUserId: userId,
          configId: currentFlag.configId,
          entityId: featureFlagId,
          entityType: "feature_flag",
          metadata: toAuditJson({ environmentIds: values.map((value) => value.environmentId) }),
          newValue: this.featureFlagAuditValue(deletedFlag),
          oldValue: this.featureFlagAuditValue(currentFlag),
          organizationId: config.project.organizationId,
          projectId: currentFlag.projectId,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return { ok: true };
  }

  async listActivity(
    userId: string,
    configId: string,
    featureFlagId: string,
    query: { cursor?: string; limit?: number } = {},
  ) {
    const config = await this.prisma.config.findUnique({
      where: { id: configId },
      select: { projectId: true },
    });
    if (!config) {
      throw new NotFoundException("Config not found");
    }

    await this.access.requireProjectAccess(userId, config.projectId);

    const flag = await this.findActiveFlag(configId, featureFlagId);
    const limit = query.limit ?? 50;
    const cursor = query.cursor ? this.decodeActivityCursor(query.cursor) : null;

    const logs = await this.prisma.auditLog.findMany({
      where: {
        configId,
        projectId: flag.projectId,
        OR: [
          {
            entityId: featureFlagId,
            entityType: "feature_flag",
          },
          {
            entityType: "feature_flag_environment_value",
            metadata: {
              path: ["featureFlagId"],
              equals: featureFlagId,
            },
          },
        ],
        ...(cursor
          ? {
              AND: [
                {
                  OR: [
                    { createdAt: { lt: new Date(cursor.createdAt) } },
                    { createdAt: new Date(cursor.createdAt), id: { lt: cursor.id } },
                  ],
                },
              ],
            }
          : {}),
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    });
    const items = logs.slice(0, limit);
    const lastItem = items.at(-1);

    return {
      items,
      nextCursor: logs.length > limit && lastItem ? this.encodeActivityCursor(lastItem) : null,
    };
  }

  async updateEnvironmentValue(
    userId: string,
    configId: string,
    featureFlagId: string,
    environmentId: string,
    input: {
      defaultValue?: unknown;
      rulesJson?: unknown;
      percentageAttribute?: string;
      percentageOptionsJson?: unknown;
    },
  ) {
    const config = await this.findConfigForWrite(userId, configId);
    const flag = await this.findActiveFlag(configId, featureFlagId);

    const environment = await this.prisma.environment.findUnique({
      where: { id: environmentId },
      select: { id: true, projectId: true },
    });

    if (!environment || environment.projectId !== flag.projectId) {
      throw new BadRequestException("Environment does not belong to the flag project");
    }

    const type = flag.type as FeatureFlagType;
    const publicUpdate: PublicEnvironmentValueUpdate = {};
    const updateData: Prisma.FeatureFlagEnvironmentValueUncheckedUpdateInput = {
      updatedByUserId: userId,
    };
    const createData = {
      projectId: flag.projectId,
      configId: flag.configId,
      featureFlagId,
      environmentId,
      defaultValue: normalizeFlagDefaultValue(
        type,
        flag.initialDefaultValue ?? defaultValueForFlagType(type),
      ) as Prisma.InputJsonValue,
      rulesJson: [] as Prisma.InputJsonValue,
      percentageAttribute: "identifier",
      percentageOptionsJson: [] as Prisma.InputJsonValue,
      updatedByUserId: userId,
    };

    if (input.defaultValue !== undefined) {
      const defaultValue = normalizeFlagDefaultValue(type, input.defaultValue);
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
      const percentageOptionsJson = normalizePercentageOptions(type, input.percentageOptionsJson);
      const jsonValue = percentageOptionsJson as Prisma.InputJsonValue;
      publicUpdate.percentageOptionsJson = jsonValue;
      updateData.percentageOptionsJson = jsonValue;
      createData.percentageOptionsJson = jsonValue;
    }

    if (Object.keys(publicUpdate).length === 0 && rulesJsonInput === undefined) {
      throw new BadRequestException("No feature flag value fields to update");
    }

    return this.prisma.$transaction(
      async (tx) => {
        if (rulesJsonInput !== undefined) {
          const rulesJson = await this.normalizeRulesJson(
            tx,
            flag,
            environmentId,
            type,
            rulesJsonInput,
          );
          const jsonValue = rulesJson as Prisma.InputJsonValue;
          publicUpdate.rulesJson = jsonValue;
          updateData.rulesJson = jsonValue;
          createData.rulesJson = jsonValue;
        }

        const existingValue = await tx.featureFlagEnvironmentValue.findUnique({
          where: {
            featureFlagId_environmentId: {
              featureFlagId,
              environmentId,
            },
          },
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
        });

        if (existingValue && !this.hasPublicValueChange(existingValue, publicUpdate)) {
          return existingValue;
        }

        const value = await tx.featureFlagEnvironmentValue.upsert({
          where: {
            featureFlagId_environmentId: {
              featureFlagId,
              environmentId,
            },
          },
          create: createData,
          update: updateData,
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
        });

        await bumpConfigEnvironmentState(tx, flag.configId, environmentId, {
          actorUserId: userId,
          metadata: toAuditJson({ featureFlagId }),
          organizationId: config.project.organizationId,
          projectId: flag.projectId,
          sourceAction: "flag_value.updated",
          sourceEntityId: value.id,
          sourceEntityType: "feature_flag_environment_value",
        });

        await createAuditLog(tx, {
          action: "flag_value.updated",
          actorUserId: userId,
          configId: flag.configId,
          entityId: value.id,
          entityType: "feature_flag_environment_value",
          metadata: toAuditJson({
            environmentId,
            featureFlagId,
            ...this.rulesAuditMetadata(existingValue?.rulesJson, value.rulesJson),
          }),
          newValue: this.flagEnvironmentValueAuditValue(value),
          oldValue: existingValue ? this.flagEnvironmentValueAuditValue(existingValue) : undefined,
          organizationId: config.project.organizationId,
          projectId: flag.projectId,
        });

        const rulesMetadata = this.rulesAuditMetadata(existingValue?.rulesJson, value.rulesJson);
        if (rulesMetadata.rulesAdded > 0) {
          await createAuditLog(tx, {
            action: "rule.added",
            actorUserId: userId,
            configId: flag.configId,
            entityId: value.id,
            entityType: "feature_flag_environment_value",
            metadata: toAuditJson({
              environmentId,
              featureFlagId,
              ...rulesMetadata,
            }),
            newValue: toAuditJson(value.rulesJson),
            oldValue: toAuditJson(existingValue?.rulesJson ?? []),
            organizationId: config.project.organizationId,
            projectId: flag.projectId,
          });
        }

        if (rulesMetadata.rulesRemoved > 0) {
          await createAuditLog(tx, {
            action: "rule.removed",
            actorUserId: userId,
            configId: flag.configId,
            entityId: value.id,
            entityType: "feature_flag_environment_value",
            metadata: toAuditJson({
              environmentId,
              featureFlagId,
              ...rulesMetadata,
            }),
            newValue: toAuditJson(value.rulesJson),
            oldValue: toAuditJson(existingValue?.rulesJson ?? []),
            organizationId: config.project.organizationId,
            projectId: flag.projectId,
          });
        }

        return value;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private featureFlagAuditValue(flag: {
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

  private flagEnvironmentValueAuditValue(value: {
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

  private hasPublicValueChange(
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

  private jsonValuesEqual(left: unknown, right: unknown): boolean {
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

  private isJsonObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private rulesAuditMetadata(
    oldRulesValue: Prisma.JsonValue | undefined,
    newRulesValue: Prisma.JsonValue,
  ) {
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

  private encodeActivityCursor(log: { createdAt: Date; id: string }) {
    return Buffer.from(
      JSON.stringify({
        createdAt: log.createdAt.toISOString(),
        id: log.id,
      }),
      "utf8",
    ).toString("base64url");
  }

  private decodeActivityCursor(value: string) {
    try {
      const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<{
        createdAt: string;
        id: string;
      }>;

      if (typeof parsed.createdAt !== "string" || typeof parsed.id !== "string") {
        throw new Error("Invalid feature flag activity cursor");
      }

      const createdAt = new Date(parsed.createdAt);
      if (Number.isNaN(createdAt.getTime())) {
        throw new Error("Invalid feature flag activity cursor");
      }

      return { createdAt: createdAt.toISOString(), id: parsed.id };
    } catch {
      throw new BadRequestException("Invalid feature flag activity cursor");
    }
  }

  private async normalizeRulesJson(
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

  private async ensureFlagIsNotReferenced(
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

  private featureFlagInclude() {
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

  private async findConfigForWrite(userId: string, configId: string) {
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

  private async findActiveFlag(configId: string, featureFlagId: string) {
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

  private normalizeFlagKey(value: string | undefined) {
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

  private async normalizeOwnerUserId(
    ownerUserId: string | null | undefined,
    organizationId: string,
  ) {
    if (!ownerUserId) {
      return null;
    }

    await this.access.requireOrganizationMember(ownerUserId, organizationId);
    return ownerUserId;
  }
}
