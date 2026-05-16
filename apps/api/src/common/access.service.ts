import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  type OrganizationRole,
  type ProjectRole,
  canManageOrganizationMembers,
  organizationManagerRoles,
} from "./roles";

export type ProjectAccess = {
  project: {
    id: string;
    organizationId: string;
    name: string;
    slug: string;
  };
  organizationRole: OrganizationRole;
  projectRole: ProjectRole | null;
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
      include: {
        organization: {
          select: { deletedAt: true },
        },
      },
    });

    if (!membership || membership.organization?.deletedAt) {
      throw new ForbiddenException("Organization access denied");
    }

    return membership;
  }

  async requireOrganizationRole(
    userId: string,
    organizationId: string,
    allowedRoles: readonly OrganizationRole[],
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
        deletedAt: true,
        organization: {
          select: { deletedAt: true },
        },
      },
    });

    if (!project || project.deletedAt || project.organization?.deletedAt) {
      throw new NotFoundException("Project not found");
    }
    const { deletedAt: _deletedAt, organization: _organization, ...projectFields } = project;

    const organizationMembership = await this.requireOrganizationMember(
      userId,
      projectFields.organizationId,
    );
    const projectMembership = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    const organizationRole = organizationMembership.role as OrganizationRole;
    const projectRole = projectMembership?.role ? (projectMembership.role as ProjectRole) : null;

    if (canManageOrganizationMembers(organizationRole)) {
      return {
        project: projectFields,
        organizationRole,
        projectRole,
      };
    }

    if (!projectMembership) {
      throw new ForbiddenException("Project access denied");
    }

    return {
      project: projectFields,
      organizationRole,
      projectRole,
    };
  }

  async requireProjectRole(
    userId: string,
    projectId: string,
    allowedProjectRoles: readonly ProjectRole[],
    allowedOrganizationRoles: readonly OrganizationRole[] = organizationManagerRoles,
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
