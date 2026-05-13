import { GithubAuthService } from "../src/auth/github-auth.service";

describe("GithubAuthService", () => {
  const previousEnv = { ...process.env };

  beforeEach(() => {
    process.env = {
      ...previousEnv,
      API_BASE_URL: "http://localhost:3000",
      GITHUB_CLIENT_ID: "github-client-id",
      GITHUB_CLIENT_SECRET: "github-client-secret",
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = previousEnv;
  });

  it("does not overwrite an existing user email when GitHub has no verified primary email", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({ access_token: "github-access-token" }),
        ok: true,
      })
      .mockResolvedValueOnce({
        json: async () => ({
          avatar_url: "https://example.com/avatar.png",
          email: "public@example.com",
          id: 123,
          login: "octocat",
          name: "Octocat",
        }),
        ok: true,
      })
      .mockResolvedValueOnce({
        json: async () => [],
        ok: true,
      });

    vi.stubGlobal("fetch", fetchMock);

    const prisma = {
      oAuthAccount: {
        findUnique: vi.fn().mockResolvedValue({ userId: "user-id" }),
      },
      user: {
        update: vi.fn().mockResolvedValue({ id: "user-id" }),
      },
    };
    const service = new GithubAuthService(prisma as never);

    await service.authenticate("github-code");

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-id" },
      data: {
        avatarUrl: "https://example.com/avatar.png",
        name: "Octocat",
      },
    });
  });
});
