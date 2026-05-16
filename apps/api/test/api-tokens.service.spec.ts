import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ApiTokensService } from "../src/api-tokens/api-tokens.service";
import { ApiTokenAccessService, ApiTokenAuditService } from "../src/api-tokens/support";
import {
  AuthenticateApiTokenService,
  CreateApiTokenService,
  ListApiTokensService,
  RevokeApiTokenService,
} from "../src/api-tokens/use-cases";
import { hashApiToken } from "../src/common/api-token-crypto";

function createApiTokensService(prisma: unknown, access: unknown) {
  const apiTokenAccess = new ApiTokenAccessService(prisma as never, access as never);
  const apiTokenAudit = new ApiTokenAuditService();

  return new ApiTokensService(
    new ListApiTokensService(prisma as never, apiTokenAccess),
    new CreateApiTokenService(prisma as never, apiTokenAccess, apiTokenAudit),
    new RevokeApiTokenService(prisma as never, apiTokenAccess, apiTokenAudit),
    new AuthenticateApiTokenService(prisma as never),
  );
}

describe("ApiTokensService", () => {
  function createService() {
    const apiToken = {
      id: "api-token-id",
      organizationId: "organization-id",
      projectId: null,
      userId: "user-id",
      name: "Automation",
      tokenPrefix: "cf_api_prefix",
      scopes: ["projects:read"],
      expiresAt: null,
      revokedAt: null,
      lastUsedAt: null,
      createdAt: new Date("2026-05-12T00:00:00.000Z"),
      updatedAt: new Date("2026-05-12T00:00:00.000Z"),
      user: {
        id: "user-id",
        name: "User",
        email: "user@example.com",
        avatarUrl: null,
      },
    };
    const tx = {
      apiToken: {
        create: vi.fn().mockResolvedValue(apiToken),
        findUnique: vi.fn().mockResolvedValue({ ...apiToken, revokedAt: new Date() }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      auditLog: {
        create: vi.fn(),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(tx)),
      apiToken: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      project: {
        findFirst: vi.fn().mockResolvedValue({ id: "project-id" }),
      },
    };
    const access = {
      requireOrganizationRole: vi.fn().mockResolvedValue({}),
    };

    return {
      access,
      apiToken,
      prisma,
      service: createApiTokensService(prisma, access),
      tx,
    };
  }

  it("does not select tokenHash when listing API tokens", async () => {
    const { access, prisma, service } = createService();
    access.requireOrganizationRole.mockResolvedValue({});
    prisma.apiToken.findMany.mockResolvedValue([]);

    await service.list("user-id", "organization-id");

    const select = prisma.apiToken.findMany.mock.calls[0][0].select;
    expect(select).not.toHaveProperty("tokenHash");
  });

  it("creates hashed API tokens and returns the raw token once", async () => {
    const { service, tx } = createService();

    const result = await service.create("user-id", "organization-id", {
      name: "Automation",
      scopes: ["projects:read"],
    });

    expect(result.token).toMatch(/^cf_api_/);
    expect(result).not.toHaveProperty("tokenHash");
    expect(tx.apiToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tokenHash: hashApiToken(result.token),
        tokenPrefix: result.token.slice(0, 18),
      }),
      select: expect.any(Object),
    });
    expect(tx.apiToken.create.mock.calls[0][0].select).not.toHaveProperty("tokenHash");
    expect(JSON.stringify(tx.auditLog.create.mock.calls)).not.toContain(result.token);
  });

  it("rejects project-scoped API tokens for projects outside the organization", async () => {
    const { prisma, service } = createService();
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(
      service.create("user-id", "organization-id", {
        name: "Automation",
        projectId: "other-project-id",
        scopes: ["projects:read"],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.project.findFirst).toHaveBeenCalledWith({
      where: { id: "other-project-id", organizationId: "organization-id" },
      select: { id: true },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects API tokens without scopes", async () => {
    const { prisma, service } = createService();

    await expect(
      service.create("user-id", "organization-id", { name: "Automation", scopes: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects API tokens with invalid scopes", async () => {
    const { prisma, service } = createService();

    await expect(
      service.create("user-id", "organization-id", {
        name: "Automation",
        scopes: ["unknown:scope"],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("revokes active API tokens without returning or selecting tokenHash", async () => {
    const { apiToken, prisma, service, tx } = createService();
    prisma.apiToken.findUnique.mockResolvedValue(apiToken);
    tx.apiToken.findUnique.mockResolvedValue({
      ...apiToken,
      revokedAt: new Date("2026-05-12T00:00:00.000Z"),
    });

    const result = await service.revoke("user-id", "api-token-id");

    expect(result).not.toHaveProperty("token");
    expect(result).not.toHaveProperty("tokenHash");
    expect(prisma.apiToken.findUnique.mock.calls[0][0].select).not.toHaveProperty("tokenHash");
    expect(tx.apiToken.findUnique.mock.calls[0][0].select).not.toHaveProperty("tokenHash");
    expect(tx.apiToken.updateMany).toHaveBeenCalledWith({
      where: { id: "api-token-id", revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(tx.auditLog.create).toHaveBeenCalledTimes(1);
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "api_token.revoked",
        actorUserId: "user-id",
        entityId: "api-token-id",
        entityType: "api_token",
        organizationId: "organization-id",
        projectId: null,
      }),
    });
  });

  it("rejects revoking already revoked API tokens without writing another audit log", async () => {
    const { apiToken, prisma, service, tx } = createService();
    prisma.apiToken.findUnique.mockResolvedValue({ ...apiToken, revokedAt: new Date() });

    await expect(service.revoke("user-id", "api-token-id")).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(tx.apiToken.updateMany).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it("authenticates active bearer tokens by hash and marks them used", async () => {
    const { apiToken, prisma, service } = createService();
    prisma.apiToken.findUnique.mockResolvedValue(apiToken);

    const result = await service.authenticate("cf_api_raw_secret");

    expect(result).toMatchObject({ id: "api-token-id", userId: "user-id" });
    expect(result).not.toHaveProperty("token");
    expect(result).not.toHaveProperty("tokenHash");
    expect(prisma.apiToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: hashApiToken("cf_api_raw_secret") },
      select: expect.any(Object),
    });
    expect(prisma.apiToken.findUnique.mock.calls[0][0].select).not.toHaveProperty("tokenHash");
    expect(prisma.apiToken.update).toHaveBeenCalledWith({
      where: { id: "api-token-id" },
      data: { lastUsedAt: expect.any(Date) },
    });
  });

  it("does not authenticate revoked tokens", async () => {
    const { apiToken, prisma, service } = createService();
    prisma.apiToken.findUnique.mockResolvedValue({ ...apiToken, revokedAt: new Date() });

    await expect(service.authenticate("cf_api_raw_secret")).resolves.toBeNull();
    expect(prisma.apiToken.update).not.toHaveBeenCalled();
  });

  it("does not authenticate expired tokens", async () => {
    const { apiToken, prisma, service } = createService();
    prisma.apiToken.findUnique.mockResolvedValue({
      ...apiToken,
      expiresAt: new Date(Date.now() - 1_000),
    });

    await expect(service.authenticate("cf_api_raw_secret")).resolves.toBeNull();
    expect(prisma.apiToken.update).not.toHaveBeenCalled();
  });

  it("authenticates active tokens when recording usage fails", async () => {
    const { apiToken, prisma, service } = createService();
    prisma.apiToken.findUnique.mockResolvedValue(apiToken);
    prisma.apiToken.update.mockRejectedValue(new Error("usage write failed"));

    await expect(service.authenticate("cf_api_raw_secret")).resolves.toMatchObject({
      id: "api-token-id",
    });
  });
});
