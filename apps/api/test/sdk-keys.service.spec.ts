import { BadRequestException } from "@nestjs/common";
import { SdkKeysService } from "../src/sdk-keys/sdk-keys.service";

describe("SdkKeysService", () => {
  function createService() {
    const prisma = {
      $transaction: vi.fn((callback) => callback(prisma)),
      auditLog: {
        create: vi.fn(),
      },
      config: {
        findUnique: vi.fn(),
      },
      environment: {
        findUnique: vi.fn(),
      },
      sdkKey: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
    };
    const access = {
      requireProjectAccess: vi.fn(),
      requireProjectRole: vi.fn(),
    };

    return {
      access,
      prisma,
      service: new SdkKeysService(prisma as never, access as never),
    };
  }

  it("does not select keyHash when listing SDK keys", async () => {
    const { access, prisma, service } = createService();
    access.requireProjectAccess.mockResolvedValue({});
    prisma.sdkKey.findMany.mockResolvedValue([]);

    await service.list("user-id", "project-id");

    const select = prisma.sdkKey.findMany.mock.calls[0][0].select;
    expect(select).not.toHaveProperty("keyHash");
  });

  it("returns the raw key once without selecting keyHash metadata", async () => {
    const { access, prisma, service } = createService();
    access.requireProjectRole.mockResolvedValue({
      project: {
        organizationId: "organization-id",
      },
    });
    prisma.config.findUnique.mockResolvedValue({
      id: "config-id",
      name: "Default",
      projectId: "project-id",
    });
    prisma.environment.findUnique.mockResolvedValue({
      id: "environment-id",
      name: "Production",
      projectId: "project-id",
    });
    prisma.sdkKey.create.mockResolvedValue({
      id: "sdk-key-id",
      keyPrefix: "cf_sdk_prefix",
      name: "SDK key",
    });

    const result = await service.create("user-id", "project-id", {
      configId: "config-id",
      environmentId: "environment-id",
      name: "SDK key",
    });

    const select = prisma.sdkKey.create.mock.calls[0][0].select;
    expect(select).not.toHaveProperty("keyHash");
    expect(result.key).toMatch(/^cf_sdk_/);
    expect(result).not.toHaveProperty("keyHash");
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "sdk_key.created",
        actorUserId: "user-id",
        configId: "config-id",
        entityId: "sdk-key-id",
        entityType: "sdk_key",
        organizationId: "organization-id",
        projectId: "project-id",
      }),
    });
  });

  it("rejects SDK keys for configs outside the project", async () => {
    const { access, prisma, service } = createService();
    access.requireProjectRole.mockResolvedValue({});
    prisma.config.findUnique.mockResolvedValue({
      id: "config-id",
      projectId: "other-project-id",
    });
    prisma.environment.findUnique.mockResolvedValue({
      id: "environment-id",
      projectId: "project-id",
    });

    await expect(
      service.create("user-id", "project-id", {
        configId: "config-id",
        environmentId: "environment-id",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.sdkKey.create).not.toHaveBeenCalled();
  });

  it("rotates an active SDK key and returns the new raw key once", async () => {
    const { access, prisma, service } = createService();
    access.requireProjectRole.mockResolvedValue({});
    const originalSdkKey = {
      id: "old-sdk-key-id",
      projectId: "project-id",
      configId: "config-id",
      environmentId: "environment-id",
      name: "Production key",
      keyPrefix: "cf_sdk_oldprefix",
      revokedAt: null,
      lastUsedAt: null,
      project: {
        organizationId: "organization-id",
      },
    };
    const revokedSdkKey = {
      id: "old-sdk-key-id",
      projectId: "project-id",
      configId: "config-id",
      environmentId: "environment-id",
      name: "Production key",
      keyPrefix: "cf_sdk_oldprefix",
      revokedAt: new Date("2026-05-12T00:00:00.000Z"),
      lastUsedAt: null,
    };
    prisma.sdkKey.findUnique
      .mockResolvedValueOnce(originalSdkKey)
      .mockResolvedValueOnce(revokedSdkKey);
    prisma.sdkKey.updateMany.mockResolvedValue({ count: 1 });
    prisma.sdkKey.create.mockResolvedValue({
      id: "new-sdk-key-id",
      projectId: "project-id",
      configId: "config-id",
      environmentId: "environment-id",
      name: "Production key",
      keyPrefix: "cf_sdk_newprefix",
      revokedAt: null,
      lastUsedAt: null,
    });

    const result = await service.rotate("user-id", "old-sdk-key-id");

    expect(result.key).toMatch(/^cf_sdk_/);
    expect(result).not.toHaveProperty("keyHash");
    expect(prisma.sdkKey.updateMany).toHaveBeenCalledWith({
      where: { id: "old-sdk-key-id", revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(prisma.sdkKey.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          configId: "config-id",
          environmentId: "environment-id",
          name: "Production key",
          projectId: "project-id",
        }),
        select: expect.not.objectContaining({ keyHash: true }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledTimes(3);
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "sdk_key.rotated",
        actorUserId: "user-id",
        configId: "config-id",
        entityId: "new-sdk-key-id",
        entityType: "sdk_key",
        organizationId: "organization-id",
        projectId: "project-id",
      }),
    });
  });

  it("rejects revoking an already revoked SDK key without writing another audit log", async () => {
    const { access, prisma, service } = createService();
    access.requireProjectRole.mockResolvedValue({});
    prisma.sdkKey.findUnique.mockResolvedValue({
      id: "sdk-key-id",
      projectId: "project-id",
      configId: "config-id",
      environmentId: "environment-id",
      name: "Production key",
      keyPrefix: "cf_sdk_prefix",
      revokedAt: new Date("2026-05-12T00:00:00.000Z"),
      lastUsedAt: null,
      project: {
        organizationId: "organization-id",
      },
    });

    await expect(service.revoke("user-id", "sdk-key-id")).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(access.requireProjectRole).toHaveBeenCalledWith("user-id", "project-id", [
      "project_admin",
    ]);
    expect(prisma.sdkKey.updateMany).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });
});
