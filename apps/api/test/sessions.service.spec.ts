import { SessionsService } from "../src/auth/sessions.service";

describe("SessionsService", () => {
  function createService() {
    const prisma = {
      session: {
        create: vi.fn().mockResolvedValue({ id: "session-id" }),
        findFirst: vi.fn(),
        updateMany: vi.fn(),
      },
    };

    return {
      prisma,
      service: new SessionsService(prisma as never),
    };
  }

  it("creates raw session tokens while persisting only their hash", async () => {
    const { prisma, service } = createService();

    const result = await service.createSession("user-id");

    expect(result.token).toMatch(/^sess_/);
    expect(prisma.session.create).toHaveBeenCalledWith({
      data: {
        userId: "user-id",
        tokenHash: service.hashToken(result.token),
        expiresAt: expect.any(Date),
      },
    });
    expect(JSON.stringify(prisma.session.create.mock.calls)).not.toContain(result.token);
  });

  it("revokes sessions by hashed token", async () => {
    const { prisma, service } = createService();

    await service.revokeToken("sess_raw_secret");

    expect(prisma.session.updateMany).toHaveBeenCalledWith({
      where: {
        tokenHash: service.hashToken("sess_raw_secret"),
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
      },
    });
  });

  it("finds active sessions only for non-deleted users", async () => {
    const { prisma, service } = createService();
    prisma.session.findFirst.mockResolvedValue({ id: "session-id" });

    await expect(service.findActiveSessionByToken("sess_raw_secret")).resolves.toEqual({
      id: "session-id",
    });

    expect(prisma.session.findFirst).toHaveBeenCalledWith({
      where: {
        tokenHash: service.hashToken("sess_raw_secret"),
        revokedAt: null,
        expiresAt: {
          gt: expect.any(Date),
        },
        user: {
          deletedAt: null,
        },
      },
      include: {
        user: true,
      },
    });
  });
});
