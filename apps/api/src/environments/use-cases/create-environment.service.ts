import { BadRequestException, Injectable } from "@nestjs/common";
import { requireSlug } from "../../common/slug";
import { PrismaService } from "../../prisma/prisma.service";
import { EnvironmentConfigStateService, EnvironmentFeatureFlagValuesService } from "../support";
import { EnvironmentAccessService } from "../support/environment-access.service";

export type CreateEnvironmentInput = {
  input: { key?: string; name?: string };
  projectId: string;
  userId: string;
};

@Injectable()
export class CreateEnvironmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly environmentAccess: EnvironmentAccessService,
    private readonly environmentConfigState: EnvironmentConfigStateService,
    private readonly environmentFeatureFlagValues: EnvironmentFeatureFlagValuesService,
  ) {}

  async execute({ userId, projectId, input }: CreateEnvironmentInput) {
    await this.environmentAccess.requireProjectManager(userId, projectId);

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

      await this.environmentConfigState.createStateRowsForEnvironment(
        tx,
        projectId,
        environment.id,
      );
      await this.environmentFeatureFlagValues.createInitialValuesForEnvironment(tx, {
        environmentId: environment.id,
        projectId,
        userId,
      });

      return environment;
    });
  }
}
