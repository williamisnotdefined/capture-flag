import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AccessService } from "../common/access.service";
import { createAuditLog, toAuditJson } from "../common/audit-log";
import { createRawSdkKey, hashSdkKey } from "../common/sdk-key-crypto";
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
    const access = await this.access.requireProjectRole(userId, projectId, ["project_admin"]);

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

    const rawKey = createRawSdkKey();
    const keyPrefix = rawKey.slice(0, 18);
    const keyHash = hashSdkKey(rawKey);

    return this.prisma.$transaction(async (tx) => {
      const sdkKey = await tx.sdkKey.create({
        data: {
          projectId,
          configId: config.id,
          environmentId: environment.id,
          name: input.name?.trim() || `${config.name} ${environment.name} SDK Key`,
          keyPrefix,
          keyHash,
        },
        select: this.sdkKeySelect(),
      });

      await createAuditLog(tx, {
        action: "sdk_key.created",
        actorUserId: userId,
        configId: config.id,
        entityId: sdkKey.id,
        entityType: "sdk_key",
        metadata: toAuditJson({ environmentId: environment.id, keyPrefix }),
        newValue: this.sdkKeyAuditValue(sdkKey),
        organizationId: access.project.organizationId,
        projectId,
      });

      return {
        ...sdkKey,
        key: rawKey,
      };
    });
  }

  async revoke(userId: string, sdkKeyId: string) {
    const sdkKey = await this.prisma.sdkKey.findUnique({
      where: { id: sdkKeyId },
      include: {
        project: {
          select: {
            organizationId: true,
          },
        },
      },
    });
    if (!sdkKey) {
      throw new NotFoundException("SDK key not found");
    }

    await this.access.requireProjectRole(userId, sdkKey.projectId, ["project_admin"]);

    return this.prisma.$transaction(async (tx) => {
      const revokedSdkKey = await tx.sdkKey.update({
        where: { id: sdkKeyId },
        data: {
          revokedAt: new Date(),
        },
        select: this.sdkKeySelect(),
      });

      await createAuditLog(tx, {
        action: "sdk_key.revoked",
        actorUserId: userId,
        configId: sdkKey.configId,
        entityId: sdkKeyId,
        entityType: "sdk_key",
        metadata: toAuditJson({ environmentId: sdkKey.environmentId, keyPrefix: sdkKey.keyPrefix }),
        newValue: this.sdkKeyAuditValue(revokedSdkKey),
        oldValue: this.sdkKeyAuditValue(sdkKey),
        organizationId: sdkKey.project.organizationId,
        projectId: sdkKey.projectId,
      });

      return revokedSdkKey;
    });
  }

  private sdkKeySelect() {
    return {
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
    } as const;
  }

  private sdkKeyAuditValue(sdkKey: {
    configId: string;
    environmentId: string;
    id: string;
    keyPrefix: string;
    lastUsedAt?: Date | null;
    name: string;
    projectId: string;
    revokedAt?: Date | null;
  }) {
    return toAuditJson({
      configId: sdkKey.configId,
      environmentId: sdkKey.environmentId,
      id: sdkKey.id,
      keyPrefix: sdkKey.keyPrefix,
      lastUsedAt: sdkKey.lastUsedAt?.toISOString() ?? null,
      name: sdkKey.name,
      projectId: sdkKey.projectId,
      revokedAt: sdkKey.revokedAt?.toISOString() ?? null,
    });
  }
}
