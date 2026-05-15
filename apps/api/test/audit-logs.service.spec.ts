import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { AuditLogsService } from "../src/audit-logs/audit-logs.service";

describe("AuditLogsService", () => {
  function createService() {
    const prisma = {
      auditLog: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      config: {
        findFirst: vi.fn(),
      },
      project: {
        findFirst: vi.fn(),
      },
    };
    const access = {
      requireOrganizationMember: vi.fn().mockResolvedValue({}),
      requireOrganizationRole: vi.fn().mockResolvedValue({}),
      requireProjectAccess: vi.fn().mockResolvedValue({
        project: { organizationId: "organization-id" },
      }),
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
    prisma.project.findFirst.mockResolvedValue({ id: "project-id" });

    await service.list("user-id", "organization-id", { projectId: "project-id" });

    expect(access.requireOrganizationMember).toHaveBeenCalledWith("user-id", "organization-id");
    expect(prisma.project.findFirst).toHaveBeenCalledWith({
      where: {
        id: "project-id",
        organizationId: "organization-id",
      },
      select: { id: true },
    });
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
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(
      service.list("user-id", "organization-id", { projectId: "project-id" }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(access.requireOrganizationMember).toHaveBeenCalledWith("user-id", "organization-id");
    expect(access.requireProjectAccess).not.toHaveBeenCalled();
    expect(prisma.auditLog.findMany).not.toHaveBeenCalled();
  });

  it("rejects config filters that do not belong to the selected project", async () => {
    const { prisma, service } = createService();
    prisma.config.findFirst.mockResolvedValue({
      id: "config-id",
      projectId: "actual-project-id",
    });

    await expect(
      service.list("user-id", "organization-id", {
        configId: "config-id",
        projectId: "requested-project-id",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.auditLog.findMany).not.toHaveBeenCalled();
  });

  it("rejects cross-organization config filters before project access", async () => {
    const { access, prisma, service } = createService();
    prisma.config.findFirst.mockResolvedValue(null);

    await expect(
      service.list("user-id", "organization-id", { configId: "config-id" }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(access.requireOrganizationMember).toHaveBeenCalledWith("user-id", "organization-id");
    expect(access.requireProjectAccess).not.toHaveBeenCalled();
    expect(prisma.auditLog.findMany).not.toHaveBeenCalled();
  });

  it("rejects invalid cursor dates before querying logs", async () => {
    const { prisma, service } = createService();
    const cursor = Buffer.from(
      JSON.stringify({ createdAt: "not-a-date", id: "audit-log-id" }),
      "utf8",
    ).toString("base64url");

    await expect(service.list("user-id", "organization-id", { cursor })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.auditLog.findMany).not.toHaveBeenCalled();
  });
});
