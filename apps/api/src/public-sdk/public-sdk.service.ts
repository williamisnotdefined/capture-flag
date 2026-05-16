import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ConfigPreviewService } from "./config-preview.service";
import { PublicConfigBuilderService } from "./public-config-builder.service";
import { PublicConfigCacheService } from "./public-config-cache.service";
import type { PublicConfigPreviewResult, PublicConfigResult } from "./public-config.types";
import { SdkKeyConfigAuthService } from "./sdk-key-config-auth.service";
import { SdkKeyUsageService } from "./sdk-key-usage.service";

@Injectable()
export class PublicSdkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sdkKeyAuth: SdkKeyConfigAuthService,
    private readonly cache: PublicConfigCacheService,
    private readonly configBuilder: PublicConfigBuilderService,
    private readonly configPreview: ConfigPreviewService,
    private readonly sdkKeyUsage: SdkKeyUsageService,
  ) {}

  async getConfig(rawSdkKey: string, ifNoneMatch?: string): Promise<PublicConfigResult> {
    const transactionResult = await this.prisma.$transaction(
      async (tx) => {
        const sdkKey = await this.sdkKeyAuth.findActiveSdkKey(tx, rawSdkKey);
        const state = await tx.configEnvironmentState.findUnique({
          where: {
            configId_environmentId: {
              configId: sdkKey.configId,
              environmentId: sdkKey.environmentId,
            },
          },
        });

        if (!state) {
          throw new NotFoundException("Config state not found");
        }

        const cacheControl = this.cache.cacheControlHeader();

        if (this.cache.matchesIfNoneMatch(ifNoneMatch, state.etag)) {
          return {
            result: {
              etag: state.etag,
              cacheControl,
              notModified: true,
            } satisfies PublicConfigResult,
            sdkKeyId: sdkKey.id,
          };
        }

        return {
          result: {
            etag: state.etag,
            cacheControl,
            notModified: false,
            body: await this.configBuilder.buildConfigBody(tx, {
              configId: sdkKey.configId,
              configKey: sdkKey.config.key,
              environmentId: sdkKey.environmentId,
              environmentKey: sdkKey.environment.key,
              generatedAt: state.generatedAt,
              projectKey: sdkKey.project.slug,
              revision: state.revision,
            }),
          } satisfies PublicConfigResult,
          sdkKeyId: sdkKey.id,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );

    await this.sdkKeyUsage.recordUse(transactionResult.sdkKeyId);

    return transactionResult.result;
  }

  previewConfig(
    userId: string,
    configId: string,
    environmentId: string,
  ): Promise<PublicConfigPreviewResult> {
    return this.configPreview.previewConfig(userId, configId, environmentId);
  }
}
