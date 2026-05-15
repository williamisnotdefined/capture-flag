import { BadRequestException } from "@nestjs/common";
import { ApiTokensService } from "../src/api-tokens/api-tokens.service";
import { hashApiToken } from "../src/common/api-token-crypto";

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
      service: new ApiTokensService(prisma as never, access as never),
      tx,
    };
  }

  it("creates hashed API tokens and returns the raw token once", async () => {
    const { service, tx } = createService();

    const result = await service.create("user-id", "organization-id", {
      name: "Automation",
      scopes: ["projects:read"],
    });

    expect(result.token).toMatch(/^cf_api_/);
    expect(tx.apiToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tokenHash: hashApiToken(result.token),
        tokenPrefix: result.token.slice(0, 18),
      }),
      select: expect.any(Object),
    });
    expect(JSON.stringify(tx.auditLog.create.mock.calls)).not.toContain(result.token);
  });

  it("rejects API tokens without scopes", async () => {
    const { prisma, service } = createService();

    await expect(
      service.create("user-id", "organization-id", { name: "Automation", scopes: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("authenticates active bearer tokens by hash and marks them used", async () => {
    const { apiToken, prisma, service } = createService();
    prisma.apiToken.findUnique.mockResolvedValue(apiToken);

    const result = await service.authenticate("cf_api_raw_secret");

    expect(result).toMatchObject({ id: "api-token-id", userId: "user-id" });
    expect(prisma.apiToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: hashApiToken("cf_api_raw_secret") },
      select: expect.any(Object),
    });
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
});
