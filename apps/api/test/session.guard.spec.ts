import { UnauthorizedException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { SessionGuard } from "../src/auth/session.guard";

describe("SessionGuard", () => {
  function createContext(cookies: Record<string, string> = {}) {
    const request = { cookies };
    const response = {
      clearCookie: vi.fn(),
    };

    return {
      context: {
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => response,
        }),
      } as ExecutionContext,
      request,
      response,
    };
  }

  function createGuard(session: unknown = null) {
    const sessions = {
      cookieName: "cf_session",
      cookieOptions: vi.fn().mockReturnValue({ httpOnly: true }),
      findActiveSessionByToken: vi.fn().mockResolvedValue(session),
    };

    return {
      guard: new SessionGuard(sessions as never),
      sessions,
    };
  }

  it("rejects requests without a session cookie", async () => {
    const { guard, sessions } = createGuard();
    const { context } = createContext();

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);

    expect(sessions.findActiveSessionByToken).not.toHaveBeenCalled();
  });

  it("clears invalid session cookies", async () => {
    const { guard, sessions } = createGuard(null);
    const { context, response } = createContext({ cf_session: "sess_raw_secret" });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);

    expect(sessions.findActiveSessionByToken).toHaveBeenCalledWith("sess_raw_secret");
    expect(sessions.cookieOptions).toHaveBeenCalledWith();
    expect(response.clearCookie).toHaveBeenCalledWith("cf_session", { httpOnly: true });
  });

  it("attaches the authenticated user for active sessions", async () => {
    const { guard } = createGuard({
      id: "session-id",
      user: {
        id: "user-id",
        name: "User",
        email: "user@example.com",
      },
    });
    const { context, request } = createContext({ cf_session: "sess_raw_secret" });

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(request).toMatchObject({
      user: {
        id: "user-id",
        name: "User",
        email: "user@example.com",
        sessionId: "session-id",
      },
    });
  });
});
