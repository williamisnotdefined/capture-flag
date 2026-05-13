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
  normalizeTags,
} from "../common/flag-values";
import { PrismaService } from "../prisma/prisma.service";

const flagKeyPattern = /^[A-Za-z][A-Za-z0-9_.-]*$/;

type PublicEnvironmentValueUpdate = {
  defaultValue?: Prisma.InputJsonValue;
  rulesJson?: Prisma.InputJsonValue;
  percentageAttribute?: string;
  percentageOptionsJson?: Prisma.InputJsonValue;
};

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

    await this.access.requireProjectRole(userId, config.projectId, ["project_admin", "developer"]);

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
          await bumpConfigEnvironmentState(tx, configId, environment.id);
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
    const flag = await this.findActiveFlag(featureFlagId);
    await this.access.requireProjectRole(userId, flag.projectId, ["project_admin", "developer"]);

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
        flag.project.organizationId,
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

    return this.prisma.$transaction(async (tx) => {
      const updatedFlag = await tx.featureFlag.update({
        where: { id: featureFlagId },
        data,
      });

      const values = await tx.featureFlagEnvironmentValue.findMany({
        where: { featureFlagId },
        select: { environmentId: true },
      });

      for (const value of values) {
        await bumpConfigEnvironmentState(tx, flag.configId, value.environmentId);
      }

      await createAuditLog(tx, {
        action: "flag.updated",
        actorUserId: userId,
        configId: flag.configId,
        entityId: featureFlagId,
        entityType: "feature_flag",
        metadata: toAuditJson({ changedFields: Object.keys(data) }),
        newValue: this.featureFlagAuditValue(updatedFlag),
        oldValue: this.featureFlagAuditValue(flag),
        organizationId: flag.project.organizationId,
        projectId: flag.projectId,
      });

      return tx.featureFlag.findUnique({
        where: { id: featureFlagId },
        include: this.featureFlagInclude(),
      });
    });
  }

  async delete(userId: string, featureFlagId: string) {
    const flag = await this.findActiveFlag(featureFlagId);
    await this.access.requireProjectRole(userId, flag.projectId, ["project_admin", "developer"]);

    await this.prisma.$transaction(async (tx) => {
      const deletedFlag = await tx.featureFlag.update({
        where: { id: featureFlagId },
        data: { deletedAt: new Date() },
      });

      const values = await tx.featureFlagEnvironmentValue.findMany({
        where: { featureFlagId },
        select: { environmentId: true },
      });

      for (const value of values) {
        await bumpConfigEnvironmentState(tx, flag.configId, value.environmentId);
      }

      await createAuditLog(tx, {
        action: "flag.deleted",
        actorUserId: userId,
        configId: flag.configId,
        entityId: featureFlagId,
        entityType: "feature_flag",
        metadata: toAuditJson({ environmentIds: values.map((value) => value.environmentId) }),
        newValue: this.featureFlagAuditValue(deletedFlag),
        oldValue: this.featureFlagAuditValue(flag),
        organizationId: flag.project.organizationId,
        projectId: flag.projectId,
      });
    });

    return { ok: true };
  }

  async updateEnvironmentValue(
    userId: string,
    featureFlagId: string,
    environmentId: string,
    input: {
      defaultValue?: unknown;
      rulesJson?: unknown;
      percentageAttribute?: string;
      percentageOptionsJson?: unknown;
    },
  ) {
    const flag = await this.findActiveFlag(featureFlagId);
    await this.access.requireProjectRole(userId, flag.projectId, ["project_admin", "developer"]);

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

    if (input.rulesJson !== undefined) {
      const rulesJson = normalizeJsonArray(input.rulesJson, "rulesJson");
      const jsonValue = rulesJson as Prisma.InputJsonValue;
      publicUpdate.rulesJson = jsonValue;
      updateData.rulesJson = jsonValue;
      createData.rulesJson = jsonValue;
    }

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

    if (Object.keys(publicUpdate).length === 0) {
      throw new BadRequestException("No feature flag value fields to update");
    }

    return this.prisma.$transaction(async (tx) => {
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

      await bumpConfigEnvironmentState(tx, flag.configId, environmentId);

      await createAuditLog(tx, {
        action: "flag_value.updated",
        actorUserId: userId,
        configId: flag.configId,
        entityId: value.id,
        entityType: "feature_flag_environment_value",
        metadata: toAuditJson({ environmentId, featureFlagId }),
        newValue: this.flagEnvironmentValueAuditValue(value),
        oldValue: existingValue ? this.flagEnvironmentValueAuditValue(existingValue) : undefined,
        organizationId: flag.project.organizationId,
        projectId: flag.projectId,
      });

      return value;
    });
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

  private jsonValuesEqual(left: Prisma.JsonValue, right: Prisma.InputJsonValue) {
    return JSON.stringify(left) === JSON.stringify(right);
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

  private async findActiveFlag(featureFlagId: string) {
    const flag = await this.prisma.featureFlag.findFirst({
      where: {
        id: featureFlagId,
        deletedAt: null,
      },
      include: {
        project: {
          select: {
            organizationId: true,
          },
        },
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
