import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { hashSdkKey } from "../common/sdk-key-crypto";
import { PrismaService } from "../prisma/prisma.service";

type PublicConfigFlag = {
  type: string;
  defaultValue: Prisma.JsonValue;
  rules: Prisma.JsonValue[];
  percentageAttribute: string;
  percentageOptions: Prisma.JsonValue[];
};

type PublicConfigSegment = {
  conditions: Prisma.JsonValue[];
};

type PublicConfigBody = {
  schemaVersion: 1;
  projectKey: string;
  configKey: string;
  environment: string;
  revision: number;
  generatedAt: string;
  segments: Record<string, PublicConfigSegment>;
  flags: Record<string, PublicConfigFlag>;
};

type PublicConfigResult =
  | {
      etag: string;
      cacheControl: string;
      notModified: true;
    }
  | {
      etag: string;
      cacheControl: string;
      notModified: false;
      body: PublicConfigBody;
    };

@Injectable()
export class PublicSdkService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig(rawSdkKey: string, ifNoneMatch?: string): Promise<PublicConfigResult> {
    const transactionResult = await this.prisma.$transaction(
      async (tx) => {
        const sdkKey = await tx.sdkKey.findUnique({
          where: { keyHash: hashSdkKey(rawSdkKey) },
          include: {
            project: {
              select: {
                id: true,
                slug: true,
              },
            },
            config: {
              select: {
                id: true,
                key: true,
              },
            },
            environment: {
              select: {
                id: true,
                key: true,
              },
            },
          },
        });

        if (!sdkKey || sdkKey.revokedAt) {
          throw new NotFoundException("SDK key not found");
        }

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

        const cacheControl = this.cacheControlHeader();

        if (this.matchesIfNoneMatch(ifNoneMatch, state.etag)) {
          return {
            result: {
              etag: state.etag,
              cacheControl,
              notModified: true,
            } satisfies PublicConfigResult,
            sdkKeyId: sdkKey.id,
          };
        }

        const values = await tx.featureFlagEnvironmentValue.findMany({
          where: {
            configId: sdkKey.configId,
            environmentId: sdkKey.environmentId,
            featureFlag: {
              deletedAt: null,
            },
          },
          include: {
            featureFlag: {
              select: {
                key: true,
                type: true,
              },
            },
          },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        });
        const segments = await tx.segment.findMany({
          where: {
            configId: sdkKey.configId,
            deletedAt: null,
          },
          orderBy: [{ key: "asc" }, { id: "asc" }],
        });

        const flags = values.reduce<Record<string, PublicConfigFlag>>((accumulator, value) => {
          accumulator[value.featureFlag.key] = {
            type: value.featureFlag.type,
            defaultValue: value.defaultValue,
            rules: this.asJsonArray(value.rulesJson),
            percentageAttribute: value.percentageAttribute,
            percentageOptions: this.asJsonArray(value.percentageOptionsJson),
          };

          return accumulator;
        }, {});
        const publicSegments = segments.reduce<Record<string, PublicConfigSegment>>(
          (accumulator, segment) => {
            accumulator[segment.key] = {
              conditions: this.asJsonArray(segment.conditionsJson),
            };

            return accumulator;
          },
          {},
        );

        return {
          result: {
            etag: state.etag,
            cacheControl,
            notModified: false,
            body: {
              schemaVersion: 1,
              projectKey: sdkKey.project.slug,
              configKey: sdkKey.config.key,
              environment: sdkKey.environment.key,
              revision: state.revision,
              generatedAt: state.generatedAt.toISOString(),
              segments: publicSegments,
              flags,
            },
          } satisfies PublicConfigResult,
          sdkKeyId: sdkKey.id,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );

    await this.recordSdkKeyUse(transactionResult.sdkKeyId);

    return transactionResult.result;
  }

  private cacheControlHeader() {
    return process.env.PUBLIC_CONFIG_CACHE_CONTROL ?? "private, no-cache";
  }

  private async recordSdkKeyUse(sdkKeyId: string) {
    try {
      await this.prisma.sdkKey.updateMany({
        where: {
          id: sdkKeyId,
          revokedAt: null,
        },
        data: { lastUsedAt: new Date() },
      });
    } catch {
      return;
    }
  }

  private matchesIfNoneMatch(ifNoneMatch: string | undefined, etag: string) {
    if (!ifNoneMatch) {
      return false;
    }

    const normalizedEtag = this.normalizeEntityTag(etag);

    return ifNoneMatch
      .split(",")
      .map((value) => value.trim())
      .some((value) => value === "*" || this.normalizeEntityTag(value) === normalizedEtag);
  }

  private normalizeEntityTag(value: string) {
    const trimmedValue = value.trim();
    return trimmedValue.toLowerCase().startsWith("w/") ? trimmedValue.slice(2) : trimmedValue;
  }

  private asJsonArray(value: Prisma.JsonValue) {
    if (!Array.isArray(value)) {
      throw new InternalServerErrorException("Public config contains an invalid JSON array");
    }

    return value;
  }
}
