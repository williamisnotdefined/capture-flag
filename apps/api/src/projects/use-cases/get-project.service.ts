import { Injectable, NotFoundException } from "@nestjs/common";
import { AccessService } from "../../common/access.service";
import { PrismaService } from "../../prisma/prisma.service";
import { projectMemberSelect } from "../support";

export type GetProjectInput = {
  projectId: string;
  userId: string;
};

@Injectable()
export class GetProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async execute({ userId, projectId }: GetProjectInput) {
    const access = await this.access.requireProjectAccess(userId, projectId);
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        configs: {
          orderBy: { createdAt: "asc" },
        },
        environments: {
          orderBy: { sortOrder: "asc" },
        },
        members: {
          select: projectMemberSelect(),
        },
      },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    return {
      ...project,
      access,
    };
  }
}
