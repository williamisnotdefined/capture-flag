import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { OrganizationRole, ProjectRole } from "./roles";

export type ProjectAccess = {
  project: {
    id: string;
    organizationId: string;
    name: string;
    slug: string;
  };
  organizationRole: string;
  projectRole: string | null;
};

@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  async requireOrganizationMember(userId: string, organizationId: string) {
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException("Organization access denied");
    }

    return membership;
  }

  async requireOrganizationRole(
    userId: string,
    organizationId: string,
    allowedRoles: OrganizationRole[],
  ) {
    const membership = await this.requireOrganizationMember(userId, organizationId);

    if (!allowedRoles.includes(membership.role as OrganizationRole)) {
      throw new ForbiddenException("Organization role is not allowed for this action");
    }

    return membership;
  }

  async requireProjectAccess(userId: string, projectId: string): Promise<ProjectAccess> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        organizationId: true,
        name: true,
        slug: true,
      },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    const organizationMembership = await this.requireOrganizationMember(
      userId,
      project.organizationId,
    );
    const projectMembership = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    const organizationRole = organizationMembership.role;
    if (["owner", "admin"].includes(organizationRole)) {
      return {
        project,
        organizationRole,
        projectRole: projectMembership?.role ?? null,
      };
    }

    if (!projectMembership) {
      throw new ForbiddenException("Project access denied");
    }

    return {
      project,
      organizationRole,
      projectRole: projectMembership.role,
    };
  }

  async requireProjectRole(
    userId: string,
    projectId: string,
    allowedProjectRoles: ProjectRole[],
    allowedOrganizationRoles: OrganizationRole[] = ["owner", "admin"],
  ) {
    const access = await this.requireProjectAccess(userId, projectId);

    if (allowedOrganizationRoles.includes(access.organizationRole as OrganizationRole)) {
      return access;
    }

    if (access.projectRole && allowedProjectRoles.includes(access.projectRole as ProjectRole)) {
      return access;
    }

    throw new ForbiddenException("Project role is not allowed for this action");
  }
}
