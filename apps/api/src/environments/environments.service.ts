import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AccessService } from "../common/access.service";
import { toAuditJson } from "../common/audit-log";
import { bumpConfigEnvironmentState, createConfigEnvironmentEtag } from "../common/config-state";
import {
  type FeatureFlagType,
  defaultValueForFlagType,
  isFeatureFlagType,
  normalizeFlagDefaultValue,
} from "../common/flag-values";
import { projectManagerRoles } from "../common/roles";
import { requireSlug } from "../common/slug";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class EnvironmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async list(userId: string, projectId: string) {
    await this.access.requireProjectAccess(userId, projectId);

    return this.prisma.environment.findMany({
      where: { projectId },
      orderBy: { sortOrder: "asc" },
    });
  }

  async create(userId: string, projectId: string, input: { name?: string; key?: string }) {
    await this.access.requireProjectRole(userId, projectId, projectManagerRoles);

    const name = input.name?.trim();
    if (!name) {
      throw new BadRequestException("Environment name is required");
    }

    const key = requireSlug(input.key ?? name, "environment");

    return this.prisma.$transaction(async (tx) => {
      const currentCount = await tx.environment.count({ where: { projectId } });
      const environment = await tx.environment.create({
        data: {
          projectId,
          name,
          key,
          sortOrder: currentCount + 1,
        },
      });

      const configs = await tx.config.findMany({ where: { projectId } });
      const flags = await tx.featureFlag.findMany({
        where: {
          projectId,
          deletedAt: null,
        },
        select: {
          id: true,
          configId: true,
          initialDefaultValue: true,
          type: true,
        },
      });

      if (configs.length > 0) {
        await tx.configEnvironmentState.createMany({
          data: configs.map((config) => ({
            projectId,
            configId: config.id,
            environmentId: environment.id,
            revision: 1,
            etag: createConfigEnvironmentEtag(config.id, environment.id, 1),
            generatedAt: new Date(),
          })),
        });
      }

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
            projectId,
            configId: flag.configId,
            featureFlagId: flag.id,
            environmentId: environment.id,
            defaultValue: normalizeFlagDefaultValue(
              flag.type,
              flag.initialDefaultValue ?? defaultValueForFlagType(flag.type),
            ) as Prisma.InputJsonValue,
            rulesJson: [] as Prisma.InputJsonValue,
            percentageAttribute: "identifier",
            percentageOptionsJson: [] as Prisma.InputJsonValue,
            updatedByUserId: userId,
          })),
        });
      }

      return environment;
    });
  }

  async update(
    userId: string,
    environmentId: string,
    input: { name?: string; key?: string; sortOrder?: number },
  ) {
    const environment = await this.prisma.environment.findUnique({ where: { id: environmentId } });
    if (!environment) {
      throw new NotFoundException("Environment not found");
    }

    const access = await this.access.requireProjectRole(
      userId,
      environment.projectId,
      projectManagerRoles,
    );

    const data: { name?: string; key?: string; sortOrder?: number } = {};
    let shouldBumpPublicConfig = false;
    if (input.name?.trim()) {
      data.name = input.name.trim();
    }

    if (input.key?.trim()) {
      const key = requireSlug(input.key, "environment");
      data.key = key;
      shouldBumpPublicConfig = key !== environment.key;
    }

    if (typeof input.sortOrder === "number") {
      data.sortOrder = input.sortOrder;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException("No environment fields to update");
    }

    if (!shouldBumpPublicConfig) {
      return this.prisma.environment.update({
        where: { id: environmentId },
        data,
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedEnvironment = await tx.environment.update({
        where: { id: environmentId },
        data,
      });
      const states = await tx.configEnvironmentState.findMany({
        where: {
          environmentId,
          projectId: environment.projectId,
        },
        select: { configId: true },
      });

      for (const state of states) {
        await bumpConfigEnvironmentState(tx, state.configId, environmentId, {
          actorUserId: userId,
          metadata: toAuditJson({ environmentId }),
          organizationId: access.project.organizationId,
          projectId: environment.projectId,
          sourceAction: "environment.updated",
          sourceEntityId: environmentId,
          sourceEntityType: "environment",
        });
      }

      return updatedEnvironment;
    });
  }

  async delete(userId: string, environmentId: string) {
    const environment = await this.prisma.environment.findUnique({ where: { id: environmentId } });
    if (!environment) {
      throw new NotFoundException("Environment not found");
    }

    await this.access.requireProjectRole(userId, environment.projectId, projectManagerRoles);
    await this.prisma.environment.delete({ where: { id: environmentId } });

    return { ok: true };
  }
}
