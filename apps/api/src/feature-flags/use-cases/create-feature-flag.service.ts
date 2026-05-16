import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AccessService } from "../../common/access.service";
import { createAuditLog, toAuditJson } from "../../common/audit-log";
import { bumpConfigEnvironmentState } from "../../common/config-state";
import {
  defaultValueForFlagType,
  isFeatureFlagType,
  normalizeFlagDefaultValue,
  normalizeTags,
} from "../../common/flag-values";
import { featureFlagManagerRoles } from "../../common/roles";
import { PrismaService } from "../../prisma/prisma.service";
import { FeatureFlagSupportService } from "../support/feature-flag-support.service";

export type CreateFeatureFlagInput = {
  configId: string;
  input: {
    defaultValue?: unknown;
    description?: string;
    hint?: string;
    key?: string;
    name?: string;
    ownerUserId?: string | null;
    tags?: unknown;
    type?: string;
  };
  userId: string;
};

@Injectable()
export class CreateFeatureFlagService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly support: FeatureFlagSupportService,
  ) {}

  async execute({ userId, configId, input }: CreateFeatureFlagInput) {
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

    const key = this.support.normalizeFlagKey(input.key);
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
    const ownerUserId = await this.support.normalizeOwnerUserId(
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
        newValue: this.support.featureFlagAuditValue(flag),
        organizationId: config.project.organizationId,
        projectId: config.projectId,
      });

      return tx.featureFlag.findUnique({
        where: { id: flag.id },
        include: this.support.featureFlagInclude(),
      });
    });
  }
}
