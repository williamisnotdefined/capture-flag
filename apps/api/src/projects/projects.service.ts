import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AccessService } from "../common/access.service";
import { createAuditLog, toAuditJson } from "../common/audit-log";
import { bumpConfigEnvironmentState } from "../common/config-state";
import { isProjectRole, organizationManagerRoles, projectManagerRoles } from "../common/roles";
import { requireSlug } from "../common/slug";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async listForOrganization(userId: string, organizationId: string) {
    const organizationMembership = await this.access.requireOrganizationMember(
      userId,
      organizationId,
    );

    const projects = await this.prisma.project.findMany({
      where: {
        organizationId,
        ...(organizationMembership.role === "owner" || organizationMembership.role === "admin"
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
        members: {
          where: { userId },
          select: { role: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return projects.map(({ members, ...project }) => ({
      ...project,
      currentUserProjectRole: members[0]?.role ?? null,
    }));
  }

  async create(userId: string, organizationId: string, input: { name?: string; slug?: string }) {
    await this.access.requireOrganizationRole(userId, organizationId, organizationManagerRoles);

    const name = input.name?.trim();
    if (!name) {
      throw new BadRequestException("Project name is required");
    }

    const slug = requireSlug(input.slug ?? name, "project");

    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          organizationId,
          name,
          slug,
        },
      });

      const config = await tx.config.create({
        data: {
          projectId: project.id,
          key: "default",
          name: "Default",
        },
      });

      const projectMember = await tx.projectMember.upsert({
        where: {
          projectId_userId: {
            projectId: project.id,
            userId,
          },
        },
        create: {
          projectId: project.id,
          userId,
          role: "project_admin",
        },
        update: {
          role: "project_admin",
        },
      });

      await createAuditLog(tx, {
        action: "config.created",
        actorUserId: userId,
        configId: config.id,
        entityId: config.id,
        entityType: "config",
        metadata: toAuditJson({ bootstrap: true }),
        newValue: this.configAuditValue(config),
        organizationId,
        projectId: project.id,
      });

      await createAuditLog(tx, {
        action: "project_member.added",
        actorUserId: userId,
        entityId: projectMember.id,
        entityType: "project_member",
        metadata: toAuditJson({ bootstrap: true, targetUserId: userId }),
        newValue: this.projectMemberAuditValue(projectMember),
        organizationId,
        projectId: project.id,
      });

      return {
        ...project,
        configs: [config],
        environments: [],
      };
    });
  }

  async get(userId: string, projectId: string) {
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
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
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

  async update(userId: string, projectId: string, input: { name?: string; slug?: string }) {
    const access = await this.access.requireProjectRole(userId, projectId, projectManagerRoles);

    const data: { name?: string; slug?: string } = {};
    let shouldBumpPublicConfig = false;
    if (input.name?.trim()) {
      data.name = input.name.trim();
    }

    if (input.slug?.trim()) {
      const slug = requireSlug(input.slug, "project");
      data.slug = slug;
      shouldBumpPublicConfig = slug !== access.project.slug;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException("No project fields to update");
    }

    if (!shouldBumpPublicConfig) {
      return this.prisma.project.update({
        where: { id: projectId },
        data,
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data,
      });
      const states = await tx.configEnvironmentState.findMany({
        where: { projectId },
        select: {
          configId: true,
          environmentId: true,
        },
      });

      for (const state of states) {
        await bumpConfigEnvironmentState(tx, state.configId, state.environmentId, {
          actorUserId: userId,
          metadata: toAuditJson({ projectId }),
          organizationId: access.project.organizationId,
          projectId,
          sourceAction: "project.updated",
          sourceEntityId: projectId,
          sourceEntityType: "project",
        });
      }

      return updatedProject;
    });
  }

  async delete(userId: string, projectId: string) {
    await this.access.requireProjectRole(userId, projectId, projectManagerRoles);

    const auditLogCount = await this.prisma.auditLog.count({ where: { projectId } });
    if (auditLogCount > 0) {
      throw new BadRequestException("Project has audit history and cannot be hard deleted");
    }

    await this.prisma.project.delete({ where: { id: projectId } });

    return { ok: true };
  }

  async listMembers(userId: string, projectId: string) {
    await this.access.requireProjectAccess(userId, projectId);

    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async addMember(
    actorUserId: string,
    projectId: string,
    input: { userId?: string; email?: string; role?: string },
  ) {
    const access = await this.access.requireProjectRole(
      actorUserId,
      projectId,
      projectManagerRoles,
    );

    if (!isProjectRole(input.role)) {
      throw new BadRequestException("Valid project role is required");
    }
    const role = input.role;

    const user = await this.findTargetUser(input);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    await this.access.requireOrganizationMember(user.id, access.project.organizationId);

    return this.prisma.$transaction(async (tx) => {
      const existingMembership = await tx.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: user.id,
          },
        },
      });

      if (existingMembership?.role === role) {
        return tx.projectMember.findUnique({
          where: { id: existingMembership.id },
          include: this.projectMemberInclude(),
        });
      }

      const member = await tx.projectMember.upsert({
        where: {
          projectId_userId: {
            projectId,
            userId: user.id,
          },
        },
        create: {
          projectId,
          userId: user.id,
          role,
        },
        update: {
          role,
        },
        include: this.projectMemberInclude(),
      });

      await createAuditLog(tx, {
        action: existingMembership ? "project_member.updated" : "project_member.added",
        actorUserId,
        entityId: member.id,
        entityType: "project_member",
        metadata: toAuditJson({ targetUserId: user.id }),
        newValue: this.projectMemberAuditValue(member),
        oldValue: existingMembership ? this.projectMemberAuditValue(existingMembership) : undefined,
        organizationId: access.project.organizationId,
        projectId,
      });

      return member;
    });
  }

  async updateMember(
    actorUserId: string,
    projectId: string,
    memberId: string,
    input: { role?: string },
  ) {
    const access = await this.access.requireProjectRole(
      actorUserId,
      projectId,
      projectManagerRoles,
    );

    if (!isProjectRole(input.role)) {
      throw new BadRequestException("Valid project role is required");
    }

    const member = await this.prisma.projectMember.findFirst({
      where: {
        id: memberId,
        projectId,
      },
      select: { id: true, projectId: true, role: true, userId: true },
    });
    if (!member) {
      throw new NotFoundException("Project member not found");
    }

    if (member.role === input.role) {
      return this.prisma.projectMember.findUnique({
        where: { id: memberId },
        include: this.projectMemberInclude(),
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedMember = await tx.projectMember.update({
        where: { id: memberId },
        data: { role: input.role },
        include: this.projectMemberInclude(),
      });

      await createAuditLog(tx, {
        action: "project_member.updated",
        actorUserId,
        entityId: memberId,
        entityType: "project_member",
        metadata: toAuditJson({ targetUserId: member.userId }),
        newValue: this.projectMemberAuditValue(updatedMember),
        oldValue: this.projectMemberAuditValue(member),
        organizationId: access.project.organizationId,
        projectId,
      });

      return updatedMember;
    });
  }

  async removeMember(actorUserId: string, projectId: string, memberId: string) {
    const access = await this.access.requireProjectRole(
      actorUserId,
      projectId,
      projectManagerRoles,
    );

    const member = await this.prisma.projectMember.findFirst({
      where: {
        id: memberId,
        projectId,
      },
      select: { id: true, projectId: true, role: true, userId: true },
    });
    if (!member) {
      throw new NotFoundException("Project member not found");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.projectMember.delete({ where: { id: memberId } });

      await createAuditLog(tx, {
        action: "project_member.removed",
        actorUserId,
        entityId: memberId,
        entityType: "project_member",
        metadata: toAuditJson({ targetUserId: member.userId }),
        oldValue: this.projectMemberAuditValue(member),
        organizationId: access.project.organizationId,
        projectId,
      });
    });

    return { ok: true };
  }

  private async findTargetUser(input: { userId?: string; email?: string }) {
    const userId = input.userId?.trim();
    const email = input.email?.trim().toLowerCase();

    if (userId && email) {
      throw new BadRequestException("Provide exactly one of userId or email");
    }

    if (userId) {
      return this.prisma.user.findUnique({ where: { id: userId } });
    }

    if (email) {
      return this.prisma.user.findUnique({ where: { email } });
    }

    throw new BadRequestException("userId or email is required");
  }

  private projectMemberInclude() {
    return {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    } as const;
  }

  private projectMemberAuditValue(member: {
    id: string;
    projectId: string;
    role: string;
    userId: string;
  }) {
    return toAuditJson({
      id: member.id,
      projectId: member.projectId,
      role: member.role,
      userId: member.userId,
    });
  }

  private configAuditValue(config: {
    description?: string | null;
    id: string;
    key: string;
    name: string;
    projectId: string;
  }) {
    return toAuditJson({
      description: config.description ?? null,
      id: config.id,
      key: config.key,
      name: config.name,
      projectId: config.projectId,
    });
  }
}
