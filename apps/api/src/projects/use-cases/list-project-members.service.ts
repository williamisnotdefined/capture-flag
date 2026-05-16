import { Injectable } from "@nestjs/common";
import { AccessService } from "../../common/access.service";
import { PrismaService } from "../../prisma/prisma.service";
import { ProjectMemberSupportService } from "../support";

export type ListProjectMembersInput = {
  projectId: string;
  userId: string;
};

@Injectable()
export class ListProjectMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly projectMemberSupport: ProjectMemberSupportService,
  ) {}

  async execute({ userId, projectId }: ListProjectMembersInput) {
    await this.access.requireProjectAccess(userId, projectId);

    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: this.projectMemberSupport.projectMemberInclude(),
      orderBy: { createdAt: "asc" },
    });
  }
}
