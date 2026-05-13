import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { hashSdkKey } from "../common/sdk-key-crypto";
import { PrismaService } from "../prisma/prisma.service";

type PublicConfigFlag = {
  type: string;
  defaultValue: Prisma.JsonValue;
  rules: Prisma.JsonValue[];
  percentageAttribute: string;
  percentageOptions: Prisma.JsonValue[];
};

type PublicConfigBody = {
  schemaVersion: 1;
  projectKey: string;
  configKey: string;
  environment: string;
  revision: number;
  generatedAt: string;
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
    const sdkKey = await this.prisma.sdkKey.findUnique({
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

    const state = await this.prisma.configEnvironmentState.findUnique({
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

    await this.prisma.sdkKey.update({
      where: { id: sdkKey.id },
      data: { lastUsedAt: new Date() },
    });

    if (this.matchesIfNoneMatch(ifNoneMatch, state.etag)) {
      return {
        etag: state.etag,
        cacheControl,
        notModified: true,
      };
    }

    const values = await this.prisma.featureFlagEnvironmentValue.findMany({
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
      orderBy: { createdAt: "asc" },
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

    return {
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
        flags,
      },
    };
  }

  private cacheControlHeader() {
    return (
      process.env.PUBLIC_CONFIG_CACHE_CONTROL ?? "public, max-age=30, stale-while-revalidate=300"
    );
  }

  private matchesIfNoneMatch(ifNoneMatch: string | undefined, etag: string) {
    if (!ifNoneMatch) {
      return false;
    }

    return ifNoneMatch
      .split(",")
      .map((value) => value.trim())
      .some((value) => value === "*" || value === etag);
  }

  private asJsonArray(value: Prisma.JsonValue) {
    return Array.isArray(value) ? value : [];
  }
}
