import { ForbiddenException } from "@nestjs/common";
import { AccessService } from "../src/common/access.service";
import { createConfigEnvironmentEtag } from "../src/common/config-state";
import { ProjectsService } from "../src/projects/projects.service";
import { ProjectAuditService, ProjectMemberTargetService } from "../src/projects/support";
import {
  AddProjectMemberService,
  BulkDeleteProjectsService,
  BulkRemoveProjectMembersService,
  CreateProjectService,
  DeleteProjectService,
  GetProjectService,
  ListOrganizationProjectsService,
  ListProjectMembersService,
  RemoveProjectMemberService,
  UpdateProjectMemberService,
  UpdateProjectService,
} from "../src/projects/use-cases";

function createProjectsService(prisma: unknown, access: unknown) {
  const projectAudit = new ProjectAuditService();
  const projectMemberTarget = new ProjectMemberTargetService(prisma as never);

  return new ProjectsService(
    new ListOrganizationProjectsService(prisma as never, access as never),
    new CreateProjectService(prisma as never, access as never, projectAudit),
    new GetProjectService(prisma as never, access as never),
    new UpdateProjectService(prisma as never, access as never),
    new DeleteProjectService(prisma as never, access as never),
    new ListProjectMembersService(prisma as never, access as never),
    new AddProjectMemberService(
      prisma as never,
      access as never,
      projectAudit,
      projectMemberTarget,
    ),
    new UpdateProjectMemberService(prisma as never, access as never, projectAudit),
    new RemoveProjectMemberService(prisma as never, access as never, projectAudit),
    new BulkDeleteProjectsService(prisma as never, access as never),
    new BulkRemoveProjectMembersService(prisma as never, access as never, projectAudit),
  );
}

describe("ProjectsService", () => {
  it("creates a default config and project admin membership with the project", async () => {
    const project = {
      id: "project-id",
      name: "Project",
      organizationId: "organization-id",
      slug: "project",
    };
    const config = {
      description: null,
      id: "config-id",
      key: "default",
      name: "Default",
      projectId: "project-id",
    };
    const tx = {
      auditLog: {
        create: vi.fn(),
      },
      config: {
        create: vi.fn().mockResolvedValue(config),
      },
      project: {
        create: vi.fn().mockResolvedValue(project),
      },
      projectMember: {
        upsert: vi.fn().mockResolvedValue({
          id: "member-id",
          projectId: "project-id",
          role: "project_admin",
          userId: "user-id",
        }),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(tx)),
    };
    const access = {
      requireOrganizationRole: vi.fn().mockResolvedValue({ role: "owner" }),
    };
    const service = createProjectsService(prisma, access);

    const result = await service.create("user-id", "organization-id", { name: "Project" });

    expect(tx.config.create).toHaveBeenCalledWith({
      data: {
        key: "default",
        name: "Default",
        projectId: "project-id",
      },
    });
    expect(tx.projectMember.upsert).toHaveBeenCalledWith({
      where: {
        projectId_userId: {
          projectId: "project-id",
          userId: "user-id",
        },
      },
      create: {
        projectId: "project-id",
        role: "project_admin",
        userId: "user-id",
      },
      update: {
        role: "project_admin",
      },
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "config.created",
        actorUserId: "user-id",
        configId: "config-id",
        entityId: "config-id",
        entityType: "config",
        organizationId: "organization-id",
        projectId: "project-id",
      }),
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "project_member.added",
        actorUserId: "user-id",
        entityId: "member-id",
        entityType: "project_member",
        organizationId: "organization-id",
        projectId: "project-id",
      }),
    });
    expect(result).toMatchObject({
      configs: [config],
      environments: [],
      id: "project-id",
    });
  });

  it("lists projects with minimal fields and current user role", async () => {
    const project = {
      createdAt: new Date("2026-05-12T00:00:00.000Z"),
      id: "project-id",
      _count: {
        configs: 1,
        environments: 2,
        members: 3,
      },
      members: [{ role: "developer" }],
      name: "Project",
      organizationId: "organization-id",
      slug: "project",
      updatedAt: new Date("2026-05-12T00:00:00.000Z"),
    };
    const prisma = {
      project: {
        findMany: vi.fn().mockResolvedValue([project]),
      },
    };
    const access = {
      requireOrganizationMember: vi.fn().mockResolvedValue({ role: "member" }),
    };
    const service = createProjectsService(prisma, access);

    const result = await service.listForOrganization("user-id", "organization-id");

    expect(prisma.project.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: "organization-id",
        deletedAt: null,
        members: {
          some: {
            userId: "user-id",
          },
        },
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
          where: { userId: "user-id" },
          select: { role: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    });
    expect(result).toEqual([
      {
        createdAt: project.createdAt,
        configCount: 1,
        currentUserProjectRole: "developer",
        environmentCount: 2,
        id: "project-id",
        memberCount: 3,
        name: "Project",
        organizationId: "organization-id",
        slug: "project",
        updatedAt: project.updatedAt,
      },
    ]);
  });

  it("lists project members with an explicit user read model", async () => {
    const prisma = {
      projectMember: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    const access = {
      requireProjectAccess: vi.fn().mockResolvedValue({}),
    };
    const service = createProjectsService(prisma, access);

    await service.listMembers("user-id", "project-id");

    const query = prisma.projectMember.findMany.mock.calls[0][0];
    expect(query).not.toHaveProperty("include");
    expect(query).toEqual({
      where: { projectId: "project-id" },
      select: expect.objectContaining({
        id: true,
        projectId: true,
        role: true,
        user: {
          select: {
            email: true,
            id: true,
            name: true,
          },
        },
        userId: true,
      }),
      orderBy: { createdAt: "asc" },
    });
  });

  it("bumps project config states when project slug changes", async () => {
    const tx = {
      auditLog: {
        create: vi.fn(),
      },
      configEnvironmentState: {
        findMany: vi.fn().mockResolvedValue([
          { configId: "config-1", environmentId: "environment-1" },
          { configId: "config-2", environmentId: "environment-2" },
        ]),
        findUnique: vi.fn().mockResolvedValue({ revision: 2 }),
        update: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      project: {
        update: vi.fn().mockResolvedValue({
          id: "project-id",
          name: "Project",
          organizationId: "organization-id",
          slug: "new-project",
        }),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(tx)),
      project: {
        update: vi.fn(),
      },
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({
        project: {
          id: "project-id",
          organizationId: "organization-id",
          name: "Project",
          slug: "old-project",
        },
      }),
    };
    const service = createProjectsService(prisma, access);

    await service.update("user-id", "project-id", { slug: "new-project" });

    expect(tx.configEnvironmentState.findMany).toHaveBeenCalledWith({
      where: { projectId: "project-id" },
      select: {
        configId: true,
        environmentId: true,
      },
    });
    expect(tx.configEnvironmentState.updateMany).toHaveBeenCalledWith({
      where: {
        configId: "config-1",
        environmentId: "environment-1",
      },
      data: expect.objectContaining({
        revision: { increment: 1 },
      }),
    });
    expect(tx.configEnvironmentState.update).toHaveBeenCalledWith({
      where: {
        configId_environmentId: {
          configId: "config-1",
          environmentId: "environment-1",
        },
      },
      data: {
        etag: createConfigEnvironmentEtag("config-1", "environment-1", 2),
      },
    });
    expect(tx.configEnvironmentState.updateMany).toHaveBeenCalledTimes(2);
    expect(prisma.project.update).not.toHaveBeenCalled();
  });

  it("allows project admins to manage project members", async () => {
    const tx = {
      auditLog: {
        create: vi.fn(),
      },
      projectMember: {
        delete: vi.fn().mockResolvedValue({}),
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({
          id: "member-id",
          projectId: "project-id",
          role: "viewer",
          userId: "target-user-id",
        }),
        upsert: vi.fn().mockResolvedValue({
          id: "member-id",
          projectId: "project-id",
          role: "developer",
          userId: "target-user-id",
        }),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(tx)),
      projectMember: {
        findFirst: vi.fn().mockResolvedValue({
          id: "member-id",
          projectId: "project-id",
          role: "developer",
          userId: "target-user-id",
        }),
      },
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: "target-user-id" }),
      },
    };
    const access = {
      requireOrganizationMember: vi.fn().mockResolvedValue({}),
      requireProjectRole: vi.fn().mockResolvedValue({
        project: {
          organizationId: "organization-id",
        },
      }),
    };
    const service = createProjectsService(prisma, access);

    await service.addMember("actor-id", "project-id", {
      role: "developer",
      userId: "target-user-id",
    });
    await service.updateMember("actor-id", "project-id", "member-id", { role: "viewer" });
    await service.removeMember("actor-id", "project-id", "member-id");

    expect(access.requireProjectRole).toHaveBeenNthCalledWith(1, "actor-id", "project-id", [
      "project_admin",
    ]);
    expect(access.requireProjectRole).toHaveBeenNthCalledWith(2, "actor-id", "project-id", [
      "project_admin",
    ]);
    expect(access.requireProjectRole).toHaveBeenNthCalledWith(3, "actor-id", "project-id", [
      "project_admin",
    ]);
    expect(tx.projectMember.upsert).toHaveBeenCalled();
    expect(tx.projectMember.update).toHaveBeenCalled();
    expect(tx.projectMember.delete).toHaveBeenCalledWith({ where: { id: "member-id" } });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "target-user-id" },
      select: { id: true },
    });
    expect(access.requireOrganizationMember).toHaveBeenCalledWith(
      "target-user-id",
      "organization-id",
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "project_member.added",
        actorUserId: "actor-id",
        entityId: "member-id",
        entityType: "project_member",
        organizationId: "organization-id",
        projectId: "project-id",
      }),
    });
  });

  it("requires target users to belong to the project organization", async () => {
    const prisma = {
      $transaction: vi.fn(),
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: "target-user-id" }),
      },
    };
    const access = {
      requireOrganizationMember: vi.fn().mockRejectedValue(new ForbiddenException("forbidden")),
      requireProjectRole: vi.fn().mockResolvedValue({
        project: {
          organizationId: "organization-id",
        },
      }),
    };
    const service = createProjectsService(prisma, access);

    await expect(
      service.addMember("actor-id", "project-id", {
        role: "developer",
        userId: "target-user-id",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "target-user-id" },
      select: { id: true },
    });
    expect(access.requireOrganizationMember).toHaveBeenCalledWith(
      "target-user-id",
      "organization-id",
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("does not audit project member additions when the role is unchanged", async () => {
    const existingMembership = {
      id: "member-id",
      projectId: "project-id",
      role: "developer",
      userId: "target-user-id",
    };
    const tx = {
      auditLog: {
        create: vi.fn(),
      },
      projectMember: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(existingMembership)
          .mockResolvedValueOnce({
            ...existingMembership,
            user: {
              email: "target@example.com",
              id: "target-user-id",
              name: "Target User",
            },
          }),
        upsert: vi.fn(),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(tx)),
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: "target-user-id" }),
      },
    };
    const access = {
      requireOrganizationMember: vi.fn().mockResolvedValue({}),
      requireProjectRole: vi.fn().mockResolvedValue({
        project: {
          organizationId: "organization-id",
        },
      }),
    };
    const service = createProjectsService(prisma, access);

    await service.addMember("actor-id", "project-id", {
      role: "developer",
      userId: "target-user-id",
    });

    expect(tx.projectMember.findUnique).toHaveBeenNthCalledWith(1, {
      where: {
        projectId_userId: {
          projectId: "project-id",
          userId: "target-user-id",
        },
      },
      select: { id: true, projectId: true, role: true, userId: true },
    });
    expect(tx.projectMember.findUnique).toHaveBeenNthCalledWith(2, {
      where: { id: "member-id" },
      select: expect.objectContaining({
        id: true,
        projectId: true,
        role: true,
        user: expect.any(Object),
        userId: true,
      }),
    });
    expect(tx.projectMember.upsert).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it("does not audit project member updates when the role is unchanged", async () => {
    const existingMembership = {
      id: "member-id",
      projectId: "project-id",
      role: "developer",
      userId: "target-user-id",
    };
    const prisma = {
      $transaction: vi.fn(),
      projectMember: {
        findFirst: vi.fn().mockResolvedValue(existingMembership),
        findUnique: vi.fn().mockResolvedValue({
          ...existingMembership,
          user: {
            email: "target@example.com",
            id: "target-user-id",
            name: "Target User",
          },
        }),
        update: vi.fn(),
      },
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({
        project: {
          organizationId: "organization-id",
        },
      }),
    };
    const service = createProjectsService(prisma, access);

    await service.updateMember("actor-id", "project-id", "member-id", { role: "developer" });

    expect(prisma.projectMember.findFirst).toHaveBeenCalledWith({
      where: {
        id: "member-id",
        projectId: "project-id",
      },
      select: { id: true, projectId: true, role: true, userId: true },
    });
    expect(prisma.projectMember.findUnique).toHaveBeenCalledWith({
      where: { id: "member-id" },
      select: expect.objectContaining({
        id: true,
        projectId: true,
        role: true,
        user: expect.any(Object),
        userId: true,
      }),
    });
    expect(prisma.projectMember.update).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("audits old project member values when removing members", async () => {
    const member = {
      id: "member-id",
      projectId: "project-id",
      role: "developer",
      userId: "target-user-id",
    };
    const tx = {
      auditLog: {
        create: vi.fn(),
      },
      projectMember: {
        delete: vi.fn().mockResolvedValue({}),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(tx)),
      projectMember: {
        findFirst: vi.fn().mockResolvedValue(member),
      },
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({
        project: {
          organizationId: "organization-id",
        },
      }),
    };
    const service = createProjectsService(prisma, access);

    await service.removeMember("actor-id", "project-id", "member-id");

    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "project_member.removed",
        actorUserId: "actor-id",
        entityId: "member-id",
        entityType: "project_member",
        oldValue: member,
        organizationId: "organization-id",
        projectId: "project-id",
      }),
    });
  });

  it.each(["developer", "viewer"] as const)(
    "prevents project %s members from managing project members",
    async (projectRole) => {
      const prisma = {
        $transaction: vi.fn(),
        organizationMember: {
          findUnique: vi.fn().mockResolvedValue({ role: "member" }),
        },
        project: {
          findUnique: vi.fn().mockResolvedValue({
            id: "project-id",
            name: "Project",
            organizationId: "organization-id",
            slug: "project",
          }),
        },
        projectMember: {
          delete: vi.fn(),
          findFirst: vi.fn(),
          findUnique: vi.fn().mockResolvedValue({ role: projectRole }),
          update: vi.fn(),
          upsert: vi.fn(),
        },
        user: {
          findUnique: vi.fn(),
        },
      };
      const service = createProjectsService(prisma, new AccessService(prisma as never));

      await expect(
        service.addMember("actor-id", "project-id", {
          role: "developer",
          userId: "target-user-id",
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.updateMember("actor-id", "project-id", "member-id", { role: "viewer" }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.removeMember("actor-id", "project-id", "member-id"),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.projectMember.findFirst).not.toHaveBeenCalled();
      expect(prisma.projectMember.upsert).not.toHaveBeenCalled();
      expect(prisma.projectMember.update).not.toHaveBeenCalled();
      expect(prisma.projectMember.delete).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    },
  );

  it("does not manage project members when project admin access is denied", async () => {
    const prisma = {
      projectMember: {
        delete: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
    };
    const access = {
      requireOrganizationMember: vi.fn(),
      requireProjectRole: vi.fn().mockRejectedValue(new Error("forbidden")),
    };
    const service = createProjectsService(prisma, access);

    await expect(
      service.addMember("actor-id", "project-id", {
        role: "developer",
        userId: "target-user-id",
      }),
    ).rejects.toThrow("forbidden");
    await expect(
      service.updateMember("actor-id", "project-id", "member-id", { role: "viewer" }),
    ).rejects.toThrow("forbidden");
    await expect(service.removeMember("actor-id", "project-id", "member-id")).rejects.toThrow(
      "forbidden",
    );

    expect(access.requireProjectRole).toHaveBeenCalledTimes(3);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.projectMember.findFirst).not.toHaveBeenCalled();
    expect(prisma.projectMember.upsert).not.toHaveBeenCalled();
    expect(prisma.projectMember.update).not.toHaveBeenCalled();
    expect(prisma.projectMember.delete).not.toHaveBeenCalled();
  });

  it("soft deletes projects without removing audit history", async () => {
    const prisma = {
      project: {
        update: vi.fn().mockResolvedValue({}),
      },
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({}),
    };
    const service = createProjectsService(prisma, access);

    await expect(service.delete("user-id", "project-id")).resolves.toEqual({ ok: true });

    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: "project-id" },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it("bulk soft deletes projects after checking organization and project access", async () => {
    const tx = {
      project: {
        updateMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(tx)),
      project: {
        findMany: vi.fn().mockResolvedValue([{ id: "project-1" }, { id: "project-2" }]),
      },
    };
    const access = {
      requireOrganizationMember: vi.fn().mockResolvedValue({ role: "owner" }),
      requireProjectRole: vi.fn().mockResolvedValue({}),
    };
    const service = createProjectsService(prisma, access);

    await expect(
      service.bulkDelete("user-id", "organization-id", ["project-1", "project-2"]),
    ).resolves.toEqual({ count: 2, ok: true });

    expect(access.requireOrganizationMember).toHaveBeenCalledWith("user-id", "organization-id");
    expect(access.requireProjectRole).toHaveBeenCalledTimes(2);
    expect(tx.project.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["project-1", "project-2"] },
        organizationId: "organization-id",
        deletedAt: null,
      },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it("bulk removes project members and audits every removed member", async () => {
    const members = [
      { id: "member-1", projectId: "project-id", role: "developer", userId: "user-1" },
      { id: "member-2", projectId: "project-id", role: "viewer", userId: "user-2" },
    ];
    const tx = {
      auditLog: {
        create: vi.fn(),
      },
      projectMember: {
        deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
        findMany: vi.fn().mockResolvedValue(members),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(tx)),
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({
        project: { organizationId: "organization-id" },
      }),
    };
    const service = createProjectsService(prisma, access);

    await service.bulkRemoveMembers("actor-id", "project-id", ["member-1", "member-2"]);

    expect(tx.projectMember.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["member-1", "member-2"] }, projectId: "project-id" },
    });
    expect(tx.auditLog.create).toHaveBeenCalledTimes(2);
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "project_member.removed",
        entityId: "member-1",
        organizationId: "organization-id",
        projectId: "project-id",
      }),
    });
  });
});
