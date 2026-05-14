import { createConfigEnvironmentEtag } from "../src/common/config-state";
import { ProjectsService } from "../src/projects/projects.service";

describe("ProjectsService", () => {
  it("creates a default config and project admin membership with the project", async () => {
    const project = {
      id: "project-id",
      name: "Project",
      organizationId: "organization-id",
      slug: "project",
    };
    const config = {
      id: "config-id",
      key: "default",
      name: "Default",
      projectId: "project-id",
    };
    const tx = {
      config: {
        create: vi.fn().mockResolvedValue(config),
      },
      project: {
        create: vi.fn().mockResolvedValue(project),
      },
      projectMember: {
        upsert: vi.fn().mockResolvedValue({}),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(tx)),
    };
    const access = {
      requireOrganizationRole: vi.fn().mockResolvedValue({ role: "owner" }),
    };
    const service = new ProjectsService(prisma as never, access as never);

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
    const service = new ProjectsService(prisma as never, access as never);

    const result = await service.listForOrganization("user-id", "organization-id");

    expect(prisma.project.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: "organization-id",
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
        currentUserProjectRole: "developer",
        id: "project-id",
        name: "Project",
        organizationId: "organization-id",
        slug: "project",
        updatedAt: project.updatedAt,
      },
    ]);
  });

  it("bumps project config states when project slug changes", async () => {
    const tx = {
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
    const service = new ProjectsService(prisma as never, access as never);

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
});
