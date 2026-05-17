import { BadRequestException } from "@nestjs/common";
import { GithubAuthService } from "../src/auth/github-auth.service";
import { GithubOAuthClientService } from "../src/auth/github-oauth-client.service";
import { GithubOAuthConfigService } from "../src/auth/github-oauth-config.service";
import { GithubUserProvisioningService } from "../src/auth/github-user-provisioning.service";
import { AuthenticateGithubCodeService } from "../src/auth/use-cases";

type GithubEmailFixture = {
  email: string;
  primary: boolean;
  verified: boolean;
};

type GithubUserFixture = {
  email: string | null;
  id: number;
  login: string;
  name: string | null;
};

function createService(prisma: unknown) {
  const config = new GithubOAuthConfigService();
  const client = new GithubOAuthClientService(config);
  const provisioning = new GithubUserProvisioningService(prisma as never);
  const authenticateGithubCode = new AuthenticateGithubCodeService(client, provisioning);

  return new GithubAuthService(config, authenticateGithubCode);
}

function createFetchResponse(payload: unknown, ok = true) {
  return {
    json: async () => payload,
    ok,
  };
}

function stubSuccessfulGithubFetch({
  accessToken = "github-access-token",
  emails = [],
  emailsOk = true,
  user = {
    email: "public@example.com",
    id: 123,
    login: "octocat",
    name: "Octocat",
  },
}: {
  accessToken?: string;
  emails?: GithubEmailFixture[];
  emailsOk?: boolean;
  user?: GithubUserFixture;
} = {}) {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(createFetchResponse({ access_token: accessToken }))
    .mockResolvedValueOnce(createFetchResponse(user))
    .mockResolvedValueOnce(createFetchResponse(emails, emailsOk));

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

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

  it("uses the public GitHub email fallback for an existing OAuth account", async () => {
    const tx = {
      oAuthAccount: {
        update: vi.fn(),
      },
      user: {
        update: vi.fn().mockResolvedValue({ id: "user-id" }),
      },
    };
    const prisma = {
      oAuthAccount: {
        findUnique: vi.fn().mockResolvedValue({ id: "oauth-account-id", userId: "user-id" }),
      },
      $transaction: vi.fn(async (callback: (transaction: typeof tx) => unknown) => callback(tx)),
      user: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "user-id" }),
      },
    };
    stubSuccessfulGithubFetch({
      user: { email: " Public@Example.COM ", id: 123, login: "octocat", name: "Octocat" },
    });
    const service = createService(prisma);

    await service.authenticate("github-code");

    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: "user-id" },
      data: { email: "public@example.com" },
    });
    expect(tx.oAuthAccount.update).toHaveBeenCalledWith({
      where: { id: "oauth-account-id" },
      data: { providerEmail: "public@example.com" },
    });
    expect(prisma.user.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("updates a verified email and provider email without overwriting an existing user name", async () => {
    const tx = {
      oAuthAccount: {
        update: vi.fn(),
      },
      user: {
        update: vi.fn().mockResolvedValue({ id: "user-id" }),
      },
    };
    const prisma = {
      oAuthAccount: {
        findUnique: vi.fn().mockResolvedValue({ id: "oauth-account-id", userId: "user-id" }),
      },
      $transaction: vi.fn(async (callback: (transaction: typeof tx) => unknown) => callback(tx)),
      user: {
        findUniqueOrThrow: vi.fn(),
      },
    };
    stubSuccessfulGithubFetch({
      emails: [{ email: "updated@example.com", primary: true, verified: true }],
    });
    const service = createService(prisma);

    await service.authenticate("github-code");

    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: "user-id" },
      data: { email: "updated@example.com" },
    });
    expect(tx.oAuthAccount.update).toHaveBeenCalledWith({
      where: { id: "oauth-account-id" },
      data: { providerEmail: "updated@example.com" },
    });
    expect(prisma.user.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("does not persist anything when GitHub email permission is missing", async () => {
    const prisma = {
      oAuthAccount: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(),
      user: {
        findUniqueOrThrow: vi.fn(),
        update: vi.fn(),
      },
    };
    stubSuccessfulGithubFetch({ emailsOk: false });
    const service = createService(prisma);

    await expect(service.authenticate("github-code")).rejects.toThrow(
      "GitHub email permission is required",
    );

    expect(prisma.oAuthAccount.findUnique).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("does not persist anything when GitHub token exchange fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createFetchResponse({ error_description: "Bad code" }, false));
    vi.stubGlobal("fetch", fetchMock);
    const prisma = {
      oAuthAccount: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(),
      user: {
        findUniqueOrThrow: vi.fn(),
        update: vi.fn(),
      },
    };
    const service = createService(prisma);

    await expect(service.authenticate("bad-code")).rejects.toBeInstanceOf(BadRequestException);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(prisma.oAuthAccount.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("uses user.upsert for a new GitHub user with a verified primary email", async () => {
    const tx = {
      oAuthAccount: {
        create: vi.fn(),
      },
      user: {
        create: vi.fn(),
        upsert: vi.fn().mockResolvedValue({ id: "user-id" }),
      },
    };
    const prisma = {
      oAuthAccount: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      $transaction: vi.fn(async (callback: (transaction: typeof tx) => unknown) => callback(tx)),
      user: {
        update: vi.fn(),
      },
    };
    stubSuccessfulGithubFetch({
      emails: [{ email: " User@Example.COM ", primary: true, verified: true }],
    });
    const service = createService(prisma);

    await service.authenticate("github-code");

    expect(tx.user.upsert).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
      create: {
        name: "Octocat",
        email: "user@example.com",
      },
      update: {
        email: "user@example.com",
      },
    });
    expect(tx.user.create).not.toHaveBeenCalled();
    expect(tx.oAuthAccount.create).toHaveBeenCalledWith({
      data: {
        userId: "user-id",
        provider: "github",
        providerUserId: "123",
        providerEmail: "user@example.com",
      },
    });

    const persistedCalls = JSON.stringify({
      oauthAccountCreate: tx.oAuthAccount.create.mock.calls,
      userUpsert: tx.user.upsert.mock.calls,
    });
    expect(persistedCalls).not.toContain("github-access-token");
  });

  it("does not persist anything when GitHub does not provide a usable email", async () => {
    const prisma = {
      oAuthAccount: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      $transaction: vi.fn(),
      user: {
        update: vi.fn(),
      },
    };
    stubSuccessfulGithubFetch({
      emails: [{ email: "user@example.com", primary: true, verified: false }],
      user: { email: null, id: 123, login: "octocat", name: "Octocat" },
    });
    const service = createService(prisma);

    await expect(service.authenticate("github-code")).rejects.toThrow(
      "GitHub account must provide an email",
    );

    expect(prisma.oAuthAccount.findUnique).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
