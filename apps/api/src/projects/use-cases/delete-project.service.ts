import { BadRequestException, Injectable } from "@nestjs/common";
import { AccessService } from "../../common/access.service";
import { projectManagerRoles } from "../../common/roles";
import { PrismaService } from "../../prisma/prisma.service";

export type DeleteProjectInput = {
  projectId: string;
  userId: string;
};

@Injectable()
export class DeleteProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async execute({ userId, projectId }: DeleteProjectInput) {
    await this.access.requireProjectRole(userId, projectId, projectManagerRoles);

    const auditLogCount = await this.prisma.auditLog.count({ where: { projectId } });
    if (auditLogCount > 0) {
      throw new BadRequestException("Project has audit history and cannot be hard deleted");
    }

    await this.prisma.project.delete({ where: { id: projectId } });

    return { ok: true };
  }
}
