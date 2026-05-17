import { DeleteCurrentUserService } from "../src/auth/use-cases/delete-current-user.service";
import { GetCurrentUserService } from "../src/auth/use-cases/get-current-user.service";
import { LogoutSessionService } from "../src/auth/use-cases/logout-session.service";
import { UpdateCurrentUserService } from "../src/auth/use-cases/update-current-user.service";

describe("Auth session use cases", () => {
  it("returns the current user with organization memberships using a minimal select", async () => {
    const prisma = {
      organizationMember: {
        findMany: vi.fn().mockResolvedValue([
          {
            role: "owner",
            organization: {
              id: "organization-id",
              _count: {
                members: 2,
                projects: 1,
              },
              name: "Organization",
              slug: "organization",
            },
          },
        ]),
      },
    };
    const service = new GetCurrentUserService(prisma as never);
    const user = {
      id: "user-id",
      name: "User",
      email: "user@example.com",
      sessionId: "session-id",
    };

    const result = await service.execute(user);

    const query = prisma.organizationMember.findMany.mock.calls[0][0];
    expect(query).not.toHaveProperty("include");
    expect(query).toEqual({
      where: { userId: "user-id", organization: { deletedAt: null } },
      select: {
        role: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            _count: {
              select: {
                members: true,
                projects: {
                  where: {
                    deletedAt: null,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    expect(result).toEqual({
      user,
      organizations: [
        {
          id: "organization-id",
          memberCount: 2,
          name: "Organization",
          projectCount: 1,
          slug: "organization",
          role: "owner",
        },
      ],
    });
  });

  it("revokes the raw session token only when one is present", async () => {
    const sessions = {
      revokeToken: vi.fn(),
    };
    const service = new LogoutSessionService(sessions as never);

    await expect(service.execute({ token: "sess_raw_secret" })).resolves.toEqual({ ok: true });
    await expect(service.execute({})).resolves.toEqual({ ok: true });

    expect(sessions.revokeToken).toHaveBeenCalledTimes(1);
    expect(sessions.revokeToken).toHaveBeenCalledWith("sess_raw_secret");
  });

  it("updates only the current user name", async () => {
    const prisma = {
      user: {
        update: vi.fn().mockResolvedValue({
          email: "user@example.com",
          id: "user-id",
          name: "Updated User",
        }),
      },
    };
    const service = new UpdateCurrentUserService(prisma as never);

    await expect(service.execute({ userId: "user-id", name: "Updated User" })).resolves.toEqual({
      email: "user@example.com",
      id: "user-id",
      name: "Updated User",
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-id" },
      data: { name: "Updated User" },
      select: {
        email: true,
        id: true,
        name: true,
      },
    });
  });

  it("soft-deletes the current user, revokes credentials and removes memberships", async () => {
    const tx = {
      apiToken: {
        updateMany: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
      oAuthAccount: {
        deleteMany: vi.fn(),
      },
      organizationMember: {
        count: vi.fn().mockResolvedValue(2),
        deleteMany: vi.fn(),
        findMany: vi
          .fn()
          .mockResolvedValueOnce([{ organizationId: "organization-id" }])
          .mockResolvedValueOnce([
            {
              id: "organization-member-id",
              organizationId: "organization-id",
              role: "owner",
              userId: "user-id",
            },
          ]),
      },
      projectMember: {
        deleteMany: vi.fn(),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "project-member-id",
            project: { organizationId: "organization-id" },
            projectId: "project-id",
            role: "developer",
            userId: "user-id",
          },
        ]),
      },
      session: {
        updateMany: vi.fn(),
      },
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: "user-id" }),
        update: vi.fn(),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx)),
    };
    const service = new DeleteCurrentUserService(prisma as never);

    await expect(service.execute({ userId: "user-id" })).resolves.toEqual({ ok: true });

    expect(tx.user.findFirst).toHaveBeenCalledWith({
      where: { id: "user-id", deletedAt: null },
      select: { id: true },
    });
    expect(tx.organizationMember.findMany.mock.calls[0][0]).toEqual({
      where: {
        role: "owner",
        userId: "user-id",
        organization: { deletedAt: null },
      },
      select: { organizationId: true },
    });
    expect(tx.organizationMember.count).toHaveBeenCalledWith({
      where: {
        organizationId: "organization-id",
        role: "owner",
        user: { deletedAt: null },
      },
    });
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: "user-id" },
      data: {
        deletedAt: expect.any(Date),
        email: null,
        name: "Conta excluida",
      },
    });
    expect(tx.session.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-id", revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(tx.apiToken.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-id", revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(tx.oAuthAccount.deleteMany).toHaveBeenCalledWith({ where: { userId: "user-id" } });
    expect(tx.projectMember.deleteMany).toHaveBeenCalledWith({ where: { userId: "user-id" } });
    expect(tx.organizationMember.deleteMany).toHaveBeenCalledWith({ where: { userId: "user-id" } });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "project_member.removed",
        actorUserId: "user-id",
        entityId: "project-member-id",
        entityType: "project_member",
        organizationId: "organization-id",
        projectId: "project-id",
      }),
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "organization_member.removed",
        actorUserId: "user-id",
        entityId: "organization-member-id",
        entityType: "organization_member",
        organizationId: "organization-id",
      }),
    });
  });

  it("blocks account deletion when the user is the last active organization owner", async () => {
    const tx = {
      organizationMember: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([{ organizationId: "organization-id" }]),
      },
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: "user-id" }),
        update: vi.fn(),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx)),
    };
    const service = new DeleteCurrentUserService(prisma as never);

    await expect(service.execute({ userId: "user-id" })).rejects.toThrow(
      "Organization must keep at least one owner",
    );

    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it("rejects deleting an already deleted current user", async () => {
    const tx = {
      organizationMember: {
        findMany: vi.fn(),
      },
      user: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx)),
    };
    const service = new DeleteCurrentUserService(prisma as never);

    await expect(service.execute({ userId: "user-id" })).rejects.toThrow("User not found");
    expect(tx.organizationMember.findMany).not.toHaveBeenCalled();
  });
});
