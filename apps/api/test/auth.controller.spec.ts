import { UnauthorizedException } from "@nestjs/common";
import { AuthController } from "../src/auth/auth.controller";

describe("AuthController", () => {
  const previousEnv = { ...process.env };
  const invalidCallbacks: Array<{
    caseName: string;
    code?: string;
    cookies: Record<string, string>;
    state?: string;
  }> = [
    {
      caseName: "missing code",
      code: undefined,
      cookies: { cf_oauth_state: "state" },
      state: "state",
    },
    {
      caseName: "missing state",
      code: "github-code",
      cookies: { cf_oauth_state: "state" },
      state: undefined,
    },
    { caseName: "missing stored state", code: "github-code", cookies: {}, state: "state" },
    {
      caseName: "mismatched state",
      code: "github-code",
      cookies: { cf_oauth_state: "other-state" },
      state: "state",
    },
  ];

  beforeEach(() => {
    process.env = {
      ...previousEnv,
      CLIENT_BASE_URL: "http://client.test",
    };
  });

  afterEach(() => {
    process.env = previousEnv;
  });

  function createController() {
    const github = {
      createState: vi.fn(),
      getAuthorizationUrl: vi.fn(),
      authenticate: vi.fn(),
    };
    const sessions = {
      cookieName: "cf_session",
      cookieOptions: vi.fn().mockReturnValue({ httpOnly: true }),
      createSession: vi.fn(),
    };
    const getCurrentUser = {
      execute: vi.fn().mockResolvedValue({ user: { id: "user-id" }, organizations: [] }),
    };
    const deleteCurrentUser = {
      execute: vi.fn().mockResolvedValue({ ok: true }),
    };
    const logoutSession = {
      execute: vi.fn().mockResolvedValue({ ok: true }),
    };
    const updateCurrentUser = {
      execute: vi.fn().mockResolvedValue({
        email: "user@example.com",
        id: "user-id",
        name: "Updated User",
      }),
    };

    return {
      controller: new AuthController(
        github as never,
        sessions as never,
        deleteCurrentUser as never,
        getCurrentUser as never,
        logoutSession as never,
        updateCurrentUser as never,
      ),
      deleteCurrentUser,
      github,
      getCurrentUser,
      logoutSession,
      sessions,
      updateCurrentUser,
    };
  }

  function createResponse() {
    return {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
      redirect: vi.fn(),
    };
  }

  it.each(invalidCallbacks)(
    "rejects OAuth callback with $caseName",
    async ({ code, state, cookies }) => {
      const { controller, github, sessions } = createController();
      const response = createResponse();

      await expect(
        controller.githubCallback(code, state, { cookies } as never, response as never),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(github.authenticate).not.toHaveBeenCalled();
      expect(sessions.createSession).not.toHaveBeenCalled();
      expect(response.cookie).not.toHaveBeenCalled();
      expect(response.redirect).not.toHaveBeenCalled();
    },
  );

  it("creates a session cookie only after a valid OAuth callback", async () => {
    const { controller, github, sessions } = createController();
    const response = createResponse();
    github.authenticate.mockResolvedValue({ id: "user-id" });
    sessions.createSession.mockResolvedValue({ maxAgeMs: 60_000, token: "sess_raw_secret" });

    await controller.githubCallback(
      "github-code",
      "state",
      { cookies: { cf_oauth_state: "state" } } as never,
      response as never,
    );

    expect(github.authenticate).toHaveBeenCalledWith("github-code");
    expect(sessions.createSession).toHaveBeenCalledWith("user-id");
    expect(sessions.cookieOptions).toHaveBeenCalledWith(60_000);
    expect(response.clearCookie).toHaveBeenCalledWith("cf_oauth_state");
    expect(response.cookie).toHaveBeenCalledWith("cf_session", "sess_raw_secret", {
      httpOnly: true,
    });
    expect(response.redirect).toHaveBeenCalledWith("http://client.test");
  });

  it("does not create a session cookie when GitHub authentication fails", async () => {
    const { controller, github, sessions } = createController();
    const response = createResponse();
    github.authenticate.mockRejectedValue(new Error("GitHub OAuth failed"));

    await expect(
      controller.githubCallback(
        "github-code",
        "state",
        { cookies: { cf_oauth_state: "state" } } as never,
        response as never,
      ),
    ).rejects.toThrow("GitHub OAuth failed");

    expect(sessions.createSession).not.toHaveBeenCalled();
    expect(response.clearCookie).not.toHaveBeenCalled();
    expect(response.cookie).not.toHaveBeenCalled();
    expect(response.redirect).not.toHaveBeenCalled();
  });

  it("delegates current user response without reading Prisma in the controller", async () => {
    const { controller, getCurrentUser } = createController();
    const request = {
      user: {
        id: "user-id",
        name: "User",
        email: "user@example.com",
        sessionId: "session-id",
      },
    };

    const result = await controller.me(request as never);

    expect(getCurrentUser.execute).toHaveBeenCalledWith(request.user);
    expect(result).toEqual({ user: { id: "user-id" }, organizations: [] });
  });

  it("delegates current user updates to the use case", async () => {
    const { controller, updateCurrentUser } = createController();
    const request = {
      user: {
        id: "user-id",
        name: "User",
        email: "user@example.com",
        sessionId: "session-id",
      },
    };

    const result = await controller.updateMe(request as never, { name: "Updated User" });

    expect(updateCurrentUser.execute).toHaveBeenCalledWith({
      userId: "user-id",
      name: "Updated User",
    });
    expect(result).toEqual({
      email: "user@example.com",
      id: "user-id",
      name: "Updated User",
    });
  });

  it("delegates current user deletion and clears the session cookie", async () => {
    const { controller, deleteCurrentUser, sessions } = createController();
    const response = {
      clearCookie: vi.fn(),
    };
    const request = {
      user: {
        id: "user-id",
        name: "User",
        email: "user@example.com",
        sessionId: "session-id",
      },
    };

    const result = await controller.deleteMe(request as never, response as never);

    expect(deleteCurrentUser.execute).toHaveBeenCalledWith({ userId: "user-id" });
    expect(sessions.cookieOptions).toHaveBeenCalledWith();
    expect(response.clearCookie).toHaveBeenCalledWith("cf_session", { httpOnly: true });
    expect(result).toEqual({ ok: true });
  });

  it("delegates logout revocation and clears the session cookie", async () => {
    const { controller, logoutSession, sessions } = createController();
    const response = {
      clearCookie: vi.fn(),
    };

    const result = await controller.logout(
      { cookies: { cf_session: "sess_raw_secret" } } as never,
      response as never,
    );

    expect(logoutSession.execute).toHaveBeenCalledWith({ token: "sess_raw_secret" });
    expect(sessions.cookieOptions).toHaveBeenCalledWith();
    expect(response.clearCookie).toHaveBeenCalledWith("cf_session", { httpOnly: true });
    expect(result).toEqual({ ok: true });
  });
});
