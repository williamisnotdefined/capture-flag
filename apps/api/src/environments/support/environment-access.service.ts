import { Injectable, NotFoundException } from "@nestjs/common";
import { AccessService } from "../../common/access.service";
import { projectManagerRoles } from "../../common/roles";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class EnvironmentAccessService {
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

  async findEnvironmentForUpdate(userId: string, environmentId: string) {
    const environment = await this.prisma.environment.findUnique({ where: { id: environmentId } });
    if (!environment) {
      throw new NotFoundException("Environment not found");
    }

    const access = await this.requireProjectManager(userId, environment.projectId);

    return { access, environment };
  }
}
