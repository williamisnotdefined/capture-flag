import { AuthController } from "../src/auth/auth.controller";

describe("AuthController", () => {
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
    const logoutSession = {
      execute: vi.fn().mockResolvedValue({ ok: true }),
    };

    return {
      controller: new AuthController(
        github as never,
        sessions as never,
        getCurrentUser as never,
        logoutSession as never,
      ),
      getCurrentUser,
      logoutSession,
      sessions,
    };
  }

  it("delegates current user response without reading Prisma in the controller", async () => {
    const { controller, getCurrentUser } = createController();
    const request = {
      user: {
        id: "user-id",
        name: "User",
        email: "user@example.com",
        avatarUrl: null,
        sessionId: "session-id",
      },
    };

    const result = await controller.me(request as never);

    expect(getCurrentUser.execute).toHaveBeenCalledWith(request.user);
    expect(result).toEqual({ user: { id: "user-id" }, organizations: [] });
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
