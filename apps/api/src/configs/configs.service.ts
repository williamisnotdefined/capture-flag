import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AccessService } from "../common/access.service";
import { createAuditLog, toAuditJson } from "../common/audit-log";
import { createConfigEnvironmentEtag } from "../common/config-state";
import { requireSlug } from "../common/slug";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ConfigsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async list(userId: string, projectId: string) {
    await this.access.requireProjectAccess(userId, projectId);

    return this.prisma.config.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });
  }

  async create(
    userId: string,
    projectId: string,
    input: { key?: string; name?: string; description?: string },
  ) {
    const access = await this.access.requireProjectRole(userId, projectId, ["project_admin"]);

    const name = input.name?.trim();
    if (!name) {
      throw new BadRequestException("Config name is required");
    }

    const key = requireSlug(input.key ?? name, "config");

    return this.prisma.$transaction(async (tx) => {
      const config = await tx.config.create({
        data: {
          projectId,
          key,
          name,
          description: input.description?.trim() || null,
        },
      });

      const environments = await tx.environment.findMany({
        where: { projectId },
      });

      if (environments.length > 0) {
        await tx.configEnvironmentState.createMany({
          data: environments.map((environment) => ({
            projectId,
            configId: config.id,
            environmentId: environment.id,
            revision: 1,
            etag: createConfigEnvironmentEtag(config.id, environment.id, 1),
            generatedAt: new Date(),
          })),
        });
      }

      await createAuditLog(tx, {
        action: "config.created",
        actorUserId: userId,
        configId: config.id,
        entityId: config.id,
        entityType: "config",
        metadata: toAuditJson({
          environmentIds: environments.map((environment) => environment.id),
        }),
        newValue: this.configAuditValue(config),
        organizationId: access.project.organizationId,
        projectId,
      });

      return config;
    });
  }

  async delete(userId: string, configId: string) {
    const config = await this.prisma.config.findUnique({
      where: { id: configId },
      include: { project: { select: { organizationId: true } } },
    });
    if (!config) {
      throw new NotFoundException("Config not found");
    }

    await this.access.requireProjectRole(userId, config.projectId, ["project_admin"]);

    const configCount = await this.prisma.config.count({
      where: { projectId: config.projectId },
    });

    if (configCount <= 1) {
      throw new BadRequestException("The last config of a project cannot be deleted");
    }

    await this.prisma.$transaction(async (tx) => {
      await createAuditLog(tx, {
        action: "config.deleted",
        actorUserId: userId,
        entityId: configId,
        entityType: "config",
        oldValue: this.configAuditValue(config),
        organizationId: config.project.organizationId,
        projectId: config.projectId,
      });

      await tx.config.delete({ where: { id: configId } });
    });

    return { ok: true };
  }

  private configAuditValue(config: {
    description: string | null;
    id: string;
    key: string;
    name: string;
    projectId: string;
  }) {
    return toAuditJson({
      description: config.description,
      id: config.id,
      key: config.key,
      name: config.name,
      projectId: config.projectId,
    });
  }
}
