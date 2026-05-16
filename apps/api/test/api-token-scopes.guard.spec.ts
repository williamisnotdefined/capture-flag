import { ForbiddenException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { ApiTokenScopesGuard } from "../src/api-tokens/api-token-scopes.guard";

describe("ApiTokenScopesGuard", () => {
  function createContext(scopes: string[] | null) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          ...(scopes ? { apiToken: { scopes } } : {}),
        }),
      }),
      getHandler: () => "handler",
      getClass: () => "class",
    } as unknown as ExecutionContext;
  }

  function createGuard(requiredScopes: string[] | undefined) {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(requiredScopes),
    };

    return new ApiTokenScopesGuard(reflector as never);
  }

  it("allows session requests without API token scope checks", () => {
    const guard = createGuard(undefined);

    expect(guard.canActivate(createContext(null))).toBe(true);
  });

  it("allows API tokens with every required scope", () => {
    const guard = createGuard(["flags:read", "configs:read"]);

    expect(guard.canActivate(createContext(["flags:read", "configs:read"]))).toBe(true);
  });

  it("rejects API tokens without route scope metadata", () => {
    const guard = createGuard(undefined);

    expect(() => guard.canActivate(createContext(["flags:read"]))).toThrow(ForbiddenException);
  });

  it("rejects API tokens with empty route scope metadata", () => {
    const guard = createGuard([]);

    expect(() => guard.canActivate(createContext(["flags:read"]))).toThrow(ForbiddenException);
  });

  it("rejects API tokens missing a required scope", () => {
    const guard = createGuard(["flags:write"]);

    expect(() => guard.canActivate(createContext(["flags:read"]))).toThrow(ForbiddenException);
  });
});
