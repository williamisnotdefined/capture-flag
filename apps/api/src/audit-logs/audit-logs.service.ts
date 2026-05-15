import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AccessService } from "../common/access.service";
import { organizationManagerRoles } from "../common/roles";
import { PrismaService } from "../prisma/prisma.service";

type AuditLogFilters = {
  action?: string;
  actorUserId?: string;
  configId?: string;
  cursor?: string;
  entityId?: string;
  entityType?: string;
  from?: string;
  limit?: number;
  projectId?: string;
  to?: string;
};

type AuditLogCursor = {
  createdAt: string;
  id: string;
};

@Injectable()
export class AuditLogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async list(userId: string, organizationId: string, filters: AuditLogFilters) {
    const scopedFilters = await this.resolveScope(userId, organizationId, filters);
    const limit = filters.limit ?? 50;
    const cursor = filters.cursor ? this.decodeCursor(filters.cursor) : null;
    const where: Prisma.AuditLogWhereInput = {
      organizationId,
      ...(scopedFilters.projectId ? { projectId: scopedFilters.projectId } : {}),
      ...(scopedFilters.configId ? { configId: scopedFilters.configId } : {}),
      ...(filters.actorUserId ? { actorUserId: filters.actorUserId } : {}),
      ...(filters.entityType ? { entityType: filters.entityType } : {}),
      ...(filters.entityId ? { entityId: filters.entityId } : {}),
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.from || filters.to
        ? {
            createdAt: {
              ...(filters.from ? { gte: new Date(filters.from) } : {}),
              ...(filters.to ? { lte: new Date(filters.to) } : {}),
            },
          }
        : {}),
      ...(cursor
        ? {
            OR: [
              { createdAt: { lt: new Date(cursor.createdAt) } },
              { createdAt: new Date(cursor.createdAt), id: { lt: cursor.id } },
            ],
          }
        : {}),
    };

    const logs = await this.prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            avatarUrl: true,
            email: true,
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    });
    const items = logs.slice(0, limit);
    const lastItem = items.at(-1);

    return {
      items,
      nextCursor: logs.length > limit && lastItem ? this.encodeCursor(lastItem) : null,
    };
  }

  private async resolveScope(userId: string, organizationId: string, filters: AuditLogFilters) {
    let projectId = filters.projectId;
    const configId = filters.configId;

    if (configId) {
      await this.access.requireOrganizationMember(userId, organizationId);

      const config = await this.prisma.config.findFirst({
        where: {
          id: configId,
          project: {
            organizationId,
          },
        },
        select: {
          id: true,
          projectId: true,
        },
      });

      if (!config) {
        throw new NotFoundException("Config not found");
      }

      await this.access.requireProjectAccess(userId, config.projectId);

      if (projectId && projectId !== config.projectId) {
        throw new BadRequestException("Config does not belong to the selected project");
      }

      projectId = config.projectId;

      return { configId, projectId };
    }

    if (projectId) {
      await this.access.requireOrganizationMember(userId, organizationId);

      const project = await this.prisma.project.findFirst({
        where: {
          id: projectId,
          organizationId,
        },
        select: { id: true },
      });

      if (!project) {
        throw new NotFoundException("Project not found");
      }

      await this.access.requireProjectAccess(userId, projectId);
      return { configId, projectId };
    }

    await this.access.requireOrganizationRole(userId, organizationId, organizationManagerRoles);
    return { configId, projectId };
  }

  private encodeCursor(log: { createdAt: Date; id: string }) {
    return Buffer.from(
      JSON.stringify({
        createdAt: log.createdAt.toISOString(),
        id: log.id,
      } satisfies AuditLogCursor),
      "utf8",
    ).toString("base64url");
  }

  private decodeCursor(value: string): AuditLogCursor {
    try {
      const parsed = JSON.parse(
        Buffer.from(value, "base64url").toString("utf8"),
      ) as Partial<AuditLogCursor>;

      if (typeof parsed.createdAt !== "string" || typeof parsed.id !== "string") {
        throw new Error("Invalid audit log cursor");
      }

      const createdAt = new Date(parsed.createdAt);
      if (Number.isNaN(createdAt.getTime())) {
        throw new Error("Invalid audit log cursor");
      }

      return { createdAt: createdAt.toISOString(), id: parsed.id };
    } catch {
      throw new BadRequestException("Invalid audit log cursor");
    }
  }
}
