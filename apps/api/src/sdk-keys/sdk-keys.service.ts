import { createHash, randomBytes } from "node:crypto";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AccessService } from "../common/access.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SdkKeysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async list(userId: string, projectId: string) {
    await this.access.requireProjectAccess(userId, projectId);

    return this.prisma.sdkKey.findMany({
      where: { projectId },
      select: {
        id: true,
        projectId: true,
        configId: true,
        environmentId: true,
        name: true,
        keyPrefix: true,
        revokedAt: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true,
        config: {
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
        environment: {
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(
    userId: string,
    projectId: string,
    input: { configId?: string; environmentId?: string; name?: string },
  ) {
    await this.access.requireProjectRole(userId, projectId, ["project_admin"]);

    if (!input.configId || !input.environmentId) {
      throw new BadRequestException("configId and environmentId are required");
    }

    const [config, environment] = await Promise.all([
      this.prisma.config.findUnique({ where: { id: input.configId } }),
      this.prisma.environment.findUnique({ where: { id: input.environmentId } }),
    ]);

    if (!config || config.projectId !== projectId) {
      throw new BadRequestException("Config does not belong to the project");
    }

    if (!environment || environment.projectId !== projectId) {
      throw new BadRequestException("Environment does not belong to the project");
    }

    const rawKey = this.createRawKey();
    const keyPrefix = rawKey.slice(0, 18);
    const keyHash = this.hashKey(rawKey);

    const sdkKey = await this.prisma.sdkKey.create({
      data: {
        projectId,
        configId: config.id,
        environmentId: environment.id,
        name: input.name?.trim() || `${config.name} ${environment.name} SDK Key`,
        keyPrefix,
        keyHash,
      },
      select: {
        id: true,
        projectId: true,
        configId: true,
        environmentId: true,
        name: true,
        keyPrefix: true,
        revokedAt: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true,
        config: {
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
        environment: {
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
      },
    });

    return {
      ...sdkKey,
      key: rawKey,
    };
  }

  async revoke(userId: string, sdkKeyId: string) {
    const sdkKey = await this.prisma.sdkKey.findUnique({ where: { id: sdkKeyId } });
    if (!sdkKey) {
      throw new NotFoundException("SDK key not found");
    }

    await this.access.requireProjectRole(userId, sdkKey.projectId, ["project_admin"]);

    return this.prisma.sdkKey.update({
      where: { id: sdkKeyId },
      data: {
        revokedAt: new Date(),
      },
      select: {
        id: true,
        projectId: true,
        configId: true,
        environmentId: true,
        name: true,
        keyPrefix: true,
        revokedAt: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true,
        config: {
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
        environment: {
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
      },
    });
  }

  private createRawKey(): string {
    return `cf_sdk_${randomBytes(10).toString("hex")}_${randomBytes(24).toString("base64url")}`;
  }

  private hashKey(rawKey: string): string {
    return createHash("sha256").update(rawKey).digest("hex");
  }
}
