import { Injectable, NotFoundException } from "@nestjs/common";
import { AccessService } from "../../common/access.service";
import { projectManagerRoles } from "../../common/roles";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ConfigAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  requireProjectAccess(userId: string, projectId: string) {
    return this.access.requireProjectAccess(userId, projectId);
  }

  requireProjectManager(userId: string, projectId: string) {
    return this.access.requireProjectRole(userId, projectId, projectManagerRoles);
  }

  async findConfigForDelete(userId: string, configId: string) {
    const config = await this.prisma.config.findUnique({
      where: { id: configId },
      include: { project: { select: { organizationId: true } } },
    });
    if (!config) {
      throw new NotFoundException("Config not found");
    }

    await this.requireProjectManager(userId, config.projectId);
    return config;
  }
}
