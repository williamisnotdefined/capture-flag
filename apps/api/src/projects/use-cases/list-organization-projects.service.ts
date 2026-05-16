import { Injectable } from "@nestjs/common";
import { AccessService } from "../../common/access.service";
import { type OrganizationRole, canManageOrganizationMembers } from "../../common/roles";
import { PrismaService } from "../../prisma/prisma.service";

export type ListOrganizationProjectsInput = {
  organizationId: string;
  userId: string;
};

@Injectable()
export class ListOrganizationProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async execute({ userId, organizationId }: ListOrganizationProjectsInput) {
    const organizationMembership = await this.access.requireOrganizationMember(
      userId,
      organizationId,
    );

    const projects = await this.prisma.project.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(canManageOrganizationMembers(organizationMembership.role as OrganizationRole)
          ? {}
          : {
              members: {
                some: {
                  userId,
                },
              },
            }),
      },
      select: {
        createdAt: true,
        id: true,
        name: true,
        organizationId: true,
        slug: true,
        updatedAt: true,
        _count: {
          select: {
            configs: true,
            environments: true,
            members: true,
          },
        },
        members: {
          where: { userId },
          select: { role: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return projects.map(({ _count, members, ...project }) => ({
      ...project,
      configCount: _count?.configs ?? 0,
      currentUserProjectRole: members[0]?.role ?? null,
      environmentCount: _count?.environments ?? 0,
      memberCount: _count?.members ?? 0,
    }));
  }
}
