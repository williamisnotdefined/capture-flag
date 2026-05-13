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
});
