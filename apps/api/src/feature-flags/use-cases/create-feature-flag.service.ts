import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createAuditLog, toAuditJson } from "../../common/audit-log";
import { bumpConfigEnvironmentState } from "../../common/config-state";
import {
  defaultValueForFlagType,
  isFeatureFlagType,
  normalizeFlagDefaultValue,
  normalizeTags,
} from "../../common/flag-values";
import { PrismaService } from "../../prisma/prisma.service";
import { FeatureFlagAccessService, FeatureFlagAuditService, featureFlagInclude } from "../support";

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
    private readonly featureFlagAccess: FeatureFlagAccessService,
    private readonly featureFlagAudit: FeatureFlagAuditService,
  ) {}

  async execute({ userId, configId, input }: CreateFeatureFlagInput) {
    const config = await this.featureFlagAccess.findConfigForCreate(userId, configId);

    const key = this.featureFlagAccess.normalizeFlagKey(input.key);
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
    const ownerUserId = await this.featureFlagAccess.normalizeOwnerUserId(
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
        newValue: this.featureFlagAudit.featureFlagAuditValue(flag),
        organizationId: config.project.organizationId,
        projectId: config.projectId,
      });

      return tx.featureFlag.findUnique({
        where: { id: flag.id },
        include: featureFlagInclude(),
      });
    });
  }
}
