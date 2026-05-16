import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AccessService } from "../../common/access.service";
import { organizationManagerRoles } from "../../common/roles";
import { PrismaService } from "../../prisma/prisma.service";

type AuditLogScopeFilters = {
  configId?: string;
  projectId?: string;
};

export type AuditLogScope = {
  configId?: string;
  projectId?: string;
};

@Injectable()
export class AuditLogScopeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async resolve(
    userId: string,
    organizationId: string,
    filters: AuditLogScopeFilters,
  ): Promise<AuditLogScope> {
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
}
