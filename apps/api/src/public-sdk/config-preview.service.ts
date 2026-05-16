import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AccessService } from "../common/access.service";
import { PrismaService } from "../prisma/prisma.service";
import { PublicConfigBuilderService } from "./public-config-builder.service";
import type { PublicConfigPreviewResult } from "./public-config.types";

@Injectable()
export class ConfigPreviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly configBuilder: PublicConfigBuilderService,
  ) {}

  async previewConfig(
    userId: string,
    configId: string,
    environmentId: string,
  ): Promise<PublicConfigPreviewResult> {
    const configForAccess = await this.prisma.config.findUnique({
      where: { id: configId },
      select: { projectId: true },
    });
    if (!configForAccess) {
      throw new NotFoundException("Config not found");
    }

    await this.access.requireProjectAccess(userId, configForAccess.projectId);

    return this.prisma.$transaction(
      async (tx) => {
        const config = await tx.config.findUnique({
          where: { id: configId },
          include: {
            project: {
              select: {
                id: true,
                slug: true,
              },
            },
          },
        });
        if (!config) {
          throw new NotFoundException("Config not found");
        }

        const environment = await tx.environment.findUnique({
          where: { id: environmentId },
          select: {
            id: true,
            key: true,
            projectId: true,
          },
        });
        if (!environment || environment.projectId !== config.projectId) {
          throw new NotFoundException("Environment not found");
        }

        const state = await tx.configEnvironmentState.findUnique({
          where: {
            configId_environmentId: {
              configId,
              environmentId,
            },
          },
        });
        if (!state) {
          throw new NotFoundException("Config state not found");
        }

        return {
          body: await this.configBuilder.buildConfigBody(tx, {
            configId,
            configKey: config.key,
            environmentId,
            environmentKey: environment.key,
            generatedAt: state.generatedAt,
            projectKey: config.project.slug,
            revision: state.revision,
          }),
          etag: state.etag,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }
}
