import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  FeatureFlagAccessService,
  FeatureFlagAuditService,
  FeatureFlagConfigStateService,
  FeatureFlagCreateInputService,
  type FeatureFlagCreateInput as FeatureFlagCreatePayload,
  FeatureFlagEnvironmentValueInitializerService,
  featureFlagInclude,
} from "../support";

export type CreateFeatureFlagInput = {
  configId: string;
  input: FeatureFlagCreatePayload;
  userId: string;
};

@Injectable()
export class CreateFeatureFlagService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly featureFlagAccess: FeatureFlagAccessService,
    private readonly featureFlagAudit: FeatureFlagAuditService,
    private readonly featureFlagConfigState: FeatureFlagConfigStateService,
    private readonly featureFlagCreateInput: FeatureFlagCreateInputService,
    private readonly featureFlagEnvironmentValueInitializer: FeatureFlagEnvironmentValueInitializerService,
  ) {}

  async execute({ userId, configId, input }: CreateFeatureFlagInput) {
    const config = await this.featureFlagAccess.findConfigForCreate(userId, configId);
    const normalizedInput = await this.featureFlagCreateInput.normalize({
      input,
      organizationId: config.project.organizationId,
    });

    return this.prisma.$transaction(async (tx) => {
      const flag = await tx.featureFlag.create({
        data: {
          projectId: config.projectId,
          configId,
          key: normalizedInput.key,
          name: normalizedInput.name,
          description: normalizedInput.description,
          type: normalizedInput.type,
          initialDefaultValue: normalizedInput.defaultValue,
          tags: normalizedInput.tags,
          hint: normalizedInput.hint,
          ownerUserId: normalizedInput.ownerUserId,
        },
      });

      const environmentIds = await this.featureFlagEnvironmentValueInitializer.initialize(tx, {
        projectId: config.projectId,
        configId,
        featureFlagId: flag.id,
        defaultValue: normalizedInput.defaultValue,
        updatedByUserId: userId,
      });

      await this.featureFlagConfigState.bumpForFlagCreate(tx, {
        actorUserId: userId,
        configId,
        environmentIds,
        featureFlagId: flag.id,
        organizationId: config.project.organizationId,
        projectId: config.projectId,
      });

      await this.featureFlagAudit.writeFlagCreated(tx, {
        actorUserId: userId,
        environmentIds,
        flag,
        organizationId: config.project.organizationId,
      });

      return tx.featureFlag.findUnique({
        where: { id: flag.id },
        include: featureFlagInclude(),
      });
    });
  }
}
