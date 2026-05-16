import { BadRequestException, Injectable } from "@nestjs/common";
import { requireSlug } from "../../common/slug";
import { PrismaService } from "../../prisma/prisma.service";
import { EnvironmentAccessService, EnvironmentConfigStateService } from "../support";

export type UpdateEnvironmentInput = {
  environmentId: string;
  input: { key?: string; name?: string; sortOrder?: number };
  userId: string;
};

@Injectable()
export class UpdateEnvironmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly environmentAccess: EnvironmentAccessService,
    private readonly environmentConfigState: EnvironmentConfigStateService,
  ) {}

  async execute({ userId, environmentId, input }: UpdateEnvironmentInput) {
    const { access, environment } = await this.environmentAccess.findEnvironmentForUpdate(
      userId,
      environmentId,
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

      await this.environmentConfigState.bumpStatesForEnvironmentKeyChange(tx, {
        environmentId,
        organizationId: access.project.organizationId,
        projectId: environment.projectId,
        userId,
      });

      return updatedEnvironment;
    });
  }
}
