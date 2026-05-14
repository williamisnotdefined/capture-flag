import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AccessService } from "../common/access.service";
import {
  type FeatureFlagType,
  defaultValueForFlagType,
  isFeatureFlagType,
  normalizeFlagDefaultValue,
} from "../common/flag-values";
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

type PublicConfigPreviewResult = {
  body: PublicConfigBody;
  etag: string;
};

@Injectable()
export class PublicSdkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

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

        return {
          result: {
            etag: state.etag,
            cacheControl,
            notModified: false,
            body: await this.buildConfigBody(tx, {
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

    await this.recordSdkKeyUse(transactionResult.sdkKeyId);

    return transactionResult.result;
  }

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
          body: await this.buildConfigBody(tx, {
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

  private async buildConfigBody(
    tx: Prisma.TransactionClient,
    input: {
      configId: string;
      configKey: string;
      environmentId: string;
      environmentKey: string;
      generatedAt: Date;
      projectKey: string;
      revision: number;
    },
  ): Promise<PublicConfigBody> {
    const featureFlags = await tx.featureFlag.findMany({
      where: {
        configId: input.configId,
        deletedAt: null,
      },
      include: {
        environmentValues: {
          where: { environmentId: input.environmentId },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          take: 1,
        },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    const segments = await tx.segment.findMany({
      where: {
        configId: input.configId,
        deletedAt: null,
      },
      orderBy: [{ key: "asc" }, { id: "asc" }],
    });

    const flags = featureFlags.reduce<Record<string, PublicConfigFlag>>((accumulator, flag) => {
      const value = flag.environmentValues[0];
      const type = this.normalizeFeatureFlagType(flag.type);

      accumulator[flag.key] = {
        type,
        defaultValue: value
          ? value.defaultValue
          : (normalizeFlagDefaultValue(
              type,
              flag.initialDefaultValue ?? defaultValueForFlagType(type),
            ) as Prisma.JsonValue),
        rules: value ? this.asJsonArray(value.rulesJson) : [],
        percentageAttribute: value?.percentageAttribute ?? "identifier",
        percentageOptions: value ? this.asJsonArray(value.percentageOptionsJson) : [],
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
      schemaVersion: 1,
      projectKey: input.projectKey,
      configKey: input.configKey,
      environment: input.environmentKey,
      revision: input.revision,
      generatedAt: input.generatedAt.toISOString(),
      segments: publicSegments,
      flags,
    };
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

  private normalizeFeatureFlagType(value: string): FeatureFlagType {
    if (!isFeatureFlagType(value)) {
      throw new InternalServerErrorException("Public config contains an invalid flag type");
    }

    return value;
  }
}
