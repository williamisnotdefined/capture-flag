import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { AccessService } from "../src/common/access.service";

describe("AccessService", () => {
  function createService({
    organizationRole = "member",
    project = {
      id: "project-id",
      name: "Project",
      organizationId: "organization-id",
      slug: "project",
    },
    projectRole = "viewer",
  }: {
    organizationRole?: string | null;
    project?: { id: string; name: string; organizationId: string; slug: string } | null;
    projectRole?: string | null;
  } = {}) {
    const prisma = {
      organizationMember: {
        findUnique: vi.fn().mockResolvedValue(
          organizationRole
            ? {
                role: organizationRole,
              }
            : null,
        ),
      },
      project: {
        findUnique: vi.fn().mockResolvedValue(project),
      },
      projectMember: {
        findUnique: vi.fn().mockResolvedValue(projectRole ? { role: projectRole } : null),
      },
    };

    return {
      prisma,
      service: new AccessService(prisma as never),
    };
  }

  it("does not allow project_admin when no project role is allowed", async () => {
    const { service } = createService({ projectRole: "project_admin" });

    await expect(service.requireProjectRole("user-id", "project-id", [])).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("allows organization owners and admins to access projects without project membership", async () => {
    const { service: ownerService } = createService({
      organizationRole: "owner",
      projectRole: null,
    });
    const { service: adminService } = createService({
      organizationRole: "admin",
      projectRole: null,
    });

    await expect(
      ownerService.requireProjectAccess("owner-id", "project-id"),
    ).resolves.toMatchObject({
      organizationRole: "owner",
      projectRole: null,
    });
    await expect(
      adminService.requireProjectRole("admin-id", "project-id", []),
    ).resolves.toMatchObject({
      organizationRole: "admin",
      projectRole: null,
    });
  });

  it("denies organization members without project membership", async () => {
    const { service } = createService({ organizationRole: "member", projectRole: null });

    await expect(service.requireProjectAccess("user-id", "project-id")).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("allows project viewers to read but not write", async () => {
    const { service } = createService({ projectRole: "viewer" });

    await expect(service.requireProjectAccess("user-id", "project-id")).resolves.toMatchObject({
      projectRole: "viewer",
    });
    await expect(
      service.requireProjectRole("user-id", "project-id", ["developer"]),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("allows developers to write flags but not manage project resources", async () => {
    const { service } = createService({ projectRole: "developer" });

    await expect(
      service.requireProjectRole("user-id", "project-id", ["project_admin", "developer"]),
    ).resolves.toMatchObject({ projectRole: "developer" });
    await expect(
      service.requireProjectRole("user-id", "project-id", ["project_admin"]),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("throws not found for missing projects before checking memberships", async () => {
    const { prisma, service } = createService({ project: null });

    await expect(service.requireProjectAccess("user-id", "project-id")).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.organizationMember.findUnique).not.toHaveBeenCalled();
    expect(prisma.projectMember.findUnique).not.toHaveBeenCalled();
  });
});
