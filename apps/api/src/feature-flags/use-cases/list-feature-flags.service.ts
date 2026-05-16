import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { FeatureFlagAccessService, featureFlagInclude } from "../support";

export type ListFeatureFlagsInput = {
  configId: string;
  userId: string;
};

@Injectable()
export class ListFeatureFlagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly featureFlagAccess: FeatureFlagAccessService,
  ) {}

  async execute({ userId, configId }: ListFeatureFlagsInput) {
    await this.featureFlagAccess.findConfigForRead(userId, configId);

    return this.prisma.featureFlag.findMany({
      where: {
        configId,
        deletedAt: null,
      },
      include: featureFlagInclude(),
      orderBy: { createdAt: "asc" },
    });
  }
}
