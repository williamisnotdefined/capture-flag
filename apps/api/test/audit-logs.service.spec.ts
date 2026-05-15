import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { AuditLogsService } from "../src/audit-logs/audit-logs.service";

describe("AuditLogsService", () => {
  function createService() {
    const prisma = {
      auditLog: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      config: {
        findUnique: vi.fn(),
      },
      project: {
        findUnique: vi.fn(),
      },
    };
    const access = {
      requireOrganizationRole: vi.fn().mockResolvedValue({}),
      requireProjectAccess: vi.fn().mockResolvedValue({}),
    };

    return {
      access,
      prisma,
      service: new AuditLogsService(prisma as never, access as never),
    };
  }

  it("lists organization audit logs after organization admin access", async () => {
    const { access, prisma, service } = createService();

    await service.list("user-id", "organization-id", {
      action: "flag.updated",
      actorUserId: "actor-id",
      entityType: "feature_flag",
      from: "2026-05-01T00:00:00.000Z",
      limit: 25,
      to: "2026-05-02T00:00:00.000Z",
    });

    expect(access.requireOrganizationRole).toHaveBeenCalledWith("user-id", "organization-id", [
      "owner",
      "admin",
    ]);
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 26,
        where: expect.objectContaining({
          action: "flag.updated",
          actorUserId: "actor-id",
          entityType: "feature_flag",
          organizationId: "organization-id",
        }),
      }),
    );
  });

  it("does not query logs when organization access is denied", async () => {
    const { access, prisma, service } = createService();
    access.requireOrganizationRole.mockRejectedValue(new ForbiddenException("denied"));

    await expect(service.list("user-id", "organization-id", {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.auditLog.findMany).not.toHaveBeenCalled();
  });

  it("scopes project filters through project access", async () => {
    const { access, prisma, service } = createService();
    prisma.project.findUnique.mockResolvedValue({ organizationId: "organization-id" });

    await service.list("user-id", "organization-id", { projectId: "project-id" });

    expect(access.requireProjectAccess).toHaveBeenCalledWith("user-id", "project-id");
    expect(access.requireOrganizationRole).not.toHaveBeenCalled();
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "organization-id",
          projectId: "project-id",
        }),
      }),
    );
  });

  it("rejects cross-organization project filters before querying logs", async () => {
    const { access, prisma, service } = createService();
    prisma.project.findUnique.mockResolvedValue({ organizationId: "other-organization-id" });

    await expect(
      service.list("user-id", "organization-id", { projectId: "project-id" }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(access.requireProjectAccess).not.toHaveBeenCalled();
    expect(prisma.auditLog.findMany).not.toHaveBeenCalled();
  });

  it("rejects config filters that do not belong to the selected project", async () => {
    const { prisma, service } = createService();
    prisma.config.findUnique.mockResolvedValue({
      id: "config-id",
      projectId: "actual-project-id",
      project: { organizationId: "organization-id" },
    });

    await expect(
      service.list("user-id", "organization-id", {
        configId: "config-id",
        projectId: "requested-project-id",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.auditLog.findMany).not.toHaveBeenCalled();
  });
});
