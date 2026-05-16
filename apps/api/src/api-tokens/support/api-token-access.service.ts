import { Injectable, NotFoundException } from "@nestjs/common";
import { AccessService } from "../../common/access.service";
import { organizationManagerRoles } from "../../common/roles";
import { PrismaService } from "../../prisma/prisma.service";
import { apiTokenSelect } from "./api-token-read-model";

@Injectable()
export class ApiTokenAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  requireOrganizationWrite(userId: string, organizationId: string) {
    return this.access.requireOrganizationRole(userId, organizationId, organizationManagerRoles);
  }

  async normalizeProjectId(organizationId: string, projectId: string | undefined) {
    const normalizedProjectId = projectId?.trim() || null;
    if (!normalizedProjectId) {
      return null;
    }

    const project = await this.prisma.project.findFirst({
      where: { id: normalizedProjectId, organizationId },
      select: { id: true },
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }

    return normalizedProjectId;
  }

  async findApiTokenForWrite(userId: string, apiTokenId: string) {
    const apiToken = await this.prisma.apiToken.findUnique({
      where: { id: apiTokenId },
      select: apiTokenSelect(),
    });
    if (!apiToken) {
      throw new NotFoundException("API token not found");
    }

    await this.requireOrganizationWrite(userId, apiToken.organizationId);
    return apiToken;
  }
}
