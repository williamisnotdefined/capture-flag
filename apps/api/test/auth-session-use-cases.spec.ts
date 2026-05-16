import { GetCurrentUserService } from "../src/auth/use-cases/get-current-user.service";
import { LogoutSessionService } from "../src/auth/use-cases/logout-session.service";

describe("Auth session use cases", () => {
  it("returns the current user with organization memberships using a minimal select", async () => {
    const prisma = {
      organizationMember: {
        findMany: vi.fn().mockResolvedValue([
          {
            role: "owner",
            organization: {
              id: "organization-id",
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
      avatarUrl: null,
      sessionId: "session-id",
    };

    const result = await service.execute(user);

    const query = prisma.organizationMember.findMany.mock.calls[0][0];
    expect(query).not.toHaveProperty("include");
    expect(query).toEqual({
      where: { userId: "user-id" },
      select: {
        role: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
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
          name: "Organization",
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
});
