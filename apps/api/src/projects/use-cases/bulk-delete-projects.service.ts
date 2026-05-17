import { Injectable, NotFoundException } from "@nestjs/common";
import { AccessService } from "../../common/access.service";
import { projectManagerRoles } from "../../common/roles";
import { PrismaService } from "../../prisma/prisma.service";

export type BulkDeleteProjectsInput = {
  organizationId: string;
  projectIds: string[];
  userId: string;
};

@Injectable()
export class BulkDeleteProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async execute({ userId, organizationId, projectIds }: BulkDeleteProjectsInput) {
    await this.access.requireOrganizationMember(userId, organizationId);

    const projects = await this.prisma.project.findMany({
      where: { id: { in: projectIds }, organizationId, deletedAt: null },
      select: { id: true },
    });

    if (projects.length !== projectIds.length) {
      throw new NotFoundException("Project not found");
    }

    for (const projectId of projectIds) {
      await this.access.requireProjectRole(userId, projectId, projectManagerRoles);
    }

    const deletedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      const result = await tx.project.updateMany({
        where: { id: { in: projectIds }, organizationId, deletedAt: null },
        data: { deletedAt },
      });

      if (result.count !== projectIds.length) {
        throw new NotFoundException("Project not found");
      }
    });

    return { ok: true, count: projectIds.length };
  }
}
