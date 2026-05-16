import { Injectable, NotFoundException } from "@nestjs/common";
import { AccessService } from "../../common/access.service";
import { PrismaService } from "../../prisma/prisma.service";
import { FeatureFlagSupportService } from "../support/feature-flag-support.service";

export type ListFeatureFlagsInput = {
  configId: string;
  userId: string;
};

@Injectable()
export class ListFeatureFlagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly support: FeatureFlagSupportService,
  ) {}

  async execute({ userId, configId }: ListFeatureFlagsInput) {
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
      include: this.support.featureFlagInclude(),
      orderBy: { createdAt: "asc" },
    });
  }
}
