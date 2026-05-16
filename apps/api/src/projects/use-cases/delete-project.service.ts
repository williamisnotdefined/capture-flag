import { Injectable } from "@nestjs/common";
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

    await this.prisma.project.update({
      where: { id: projectId },
      data: { deletedAt: new Date() },
    });

    return { ok: true };
  }
}
