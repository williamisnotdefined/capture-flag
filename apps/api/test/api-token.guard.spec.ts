import { UnauthorizedException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { ApiTokenGuard } from "../src/api-tokens/api-token.guard";

describe("ApiTokenGuard", () => {
  function createContext(authorization?: string) {
    const request = {
      headers: { authorization },
    };

    return {
      context: {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      } as ExecutionContext,
      request,
    };
  }

  function createGuard(apiToken: unknown = null) {
    const apiTokens = {
      authenticate: vi.fn().mockResolvedValue(apiToken),
    };

    return {
      apiTokens,
      guard: new ApiTokenGuard(apiTokens as never),
    };
  }

  it("rejects missing bearer tokens", async () => {
    const { guard } = createGuard();
    const { context } = createContext();

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("attaches API token context for valid bearer tokens", async () => {
    const { apiTokens, guard } = createGuard({
      id: "api-token-id",
      organizationId: "organization-id",
      projectId: "project-id",
      userId: "user-id",
      tokenPrefix: "cf_api_prefix",
      scopes: ["flags:read"],
      user: {
        id: "user-id",
        name: "User",
        email: "user@example.com",
      },
    });
    const { context, request } = createContext("Bearer cf_api_raw_secret");

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(apiTokens.authenticate).toHaveBeenCalledWith("cf_api_raw_secret");
    expect(request).toMatchObject({
      apiToken: {
        id: "api-token-id",
        organizationId: "organization-id",
        projectId: "project-id",
        scopes: ["flags:read"],
      },
      user: {
        id: "user-id",
        sessionId: "",
      },
    });
  });

  it("rejects unknown bearer tokens", async () => {
    const { guard } = createGuard(null);
    const { context } = createContext("Bearer cf_api_unknown");

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
