import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AccessService } from "../common/access.service";
import { isProjectRole } from "../common/roles";
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
      include: {
        configs: true,
        environments: {
          orderBy: { sortOrder: "asc" },
        },
        members: {
          where: { userId },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return projects.map((project) => ({
      ...project,
      currentUserProjectRole: project.members[0]?.role ?? null,
    }));
  }

  async create(userId: string, organizationId: string, input: { name?: string; slug?: string }) {
    await this.access.requireOrganizationRole(userId, organizationId, ["owner", "admin"]);

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

      await tx.projectMember.upsert({
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
    await this.access.requireProjectRole(userId, projectId, ["project_admin"]);

    const data: { name?: string; slug?: string } = {};
    if (input.name?.trim()) {
      data.name = input.name.trim();
    }

    if (input.slug?.trim()) {
      data.slug = requireSlug(input.slug, "project");
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException("No project fields to update");
    }

    return this.prisma.project.update({
      where: { id: projectId },
      data,
    });
  }

  async delete(userId: string, projectId: string) {
    await this.access.requireProjectRole(userId, projectId, ["project_admin"]);
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
    const access = await this.access.requireProjectRole(actorUserId, projectId, []);

    if (!isProjectRole(input.role)) {
      throw new BadRequestException("Valid project role is required");
    }
    const role = input.role;

    const user = await this.findTargetUser(input);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    await this.access.requireOrganizationMember(user.id, access.project.organizationId);

    return this.prisma.projectMember.upsert({
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
    });
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
}
