import { Injectable } from "@nestjs/common";
import { AccessService } from "../../common/access.service";
import { PrismaService } from "../../prisma/prisma.service";
import { projectMemberSelect } from "../support";

export type ListProjectMembersInput = {
  projectId: string;
  userId: string;
};

@Injectable()
export class ListProjectMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async execute({ userId, projectId }: ListProjectMembersInput) {
    await this.access.requireProjectAccess(userId, projectId);

    return this.prisma.projectMember.findMany({
      where: { projectId },
      select: projectMemberSelect(),
      orderBy: { createdAt: "asc" },
    });
  }
}
