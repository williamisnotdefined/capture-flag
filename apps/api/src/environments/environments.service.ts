import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AccessService } from "../common/access.service";
import { createConfigEnvironmentEtag } from "../common/config-state";
import {
  type FeatureFlagType,
  defaultValueForFlagType,
  isFeatureFlagType,
} from "../common/flag-values";
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
    await this.access.requireProjectRole(userId, projectId, ["project_admin"]);

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

      const validFlags: Array<{ id: string; configId: string; type: FeatureFlagType }> =
        flags.flatMap((flag) =>
          isFeatureFlagType(flag.type) ? [{ ...flag, type: flag.type }] : [],
        );
      if (validFlags.length > 0) {
        await tx.featureFlagEnvironmentValue.createMany({
          data: validFlags.map((flag) => ({
            projectId,
            configId: flag.configId,
            featureFlagId: flag.id,
            environmentId: environment.id,
            defaultValue: defaultValueForFlagType(flag.type) as Prisma.InputJsonValue,
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

    await this.access.requireProjectRole(userId, environment.projectId, ["project_admin"]);

    const data: { name?: string; key?: string; sortOrder?: number } = {};
    if (input.name?.trim()) {
      data.name = input.name.trim();
    }

    if (input.key?.trim()) {
      data.key = requireSlug(input.key, "environment");
    }

    if (typeof input.sortOrder === "number") {
      data.sortOrder = input.sortOrder;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException("No environment fields to update");
    }

    return this.prisma.environment.update({
      where: { id: environmentId },
      data,
    });
  }

  async delete(userId: string, environmentId: string) {
    const environment = await this.prisma.environment.findUnique({ where: { id: environmentId } });
    if (!environment) {
      throw new NotFoundException("Environment not found");
    }

    await this.access.requireProjectRole(userId, environment.projectId, ["project_admin"]);
    await this.prisma.environment.delete({ where: { id: environmentId } });

    return { ok: true };
  }
}
