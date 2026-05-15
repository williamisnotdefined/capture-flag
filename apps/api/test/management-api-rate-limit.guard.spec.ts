import { HttpException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { ManagementApiRateLimitGuard } from "../src/api-tokens/management-api-rate-limit.guard";

describe("ManagementApiRateLimitGuard", () => {
  function createContext(apiTokenId: string | null, ip = "127.0.0.1", authorization?: string) {
    const response = {
      setHeader: vi.fn(),
    };
    const request = {
      headers: { authorization },
      ip,
      socket: {},
      ...(apiTokenId ? { apiToken: { id: apiTokenId } } : {}),
    };

    return {
      context: {
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => response,
        }),
      } as ExecutionContext,
      response,
    };
  }

  it("does not rate-limit session-only requests", () => {
    const guard = new ManagementApiRateLimitGuard();
    const { context } = createContext(null);

    expect(guard.canActivate(context)).toBe(true);
  });

  it("limits management API requests by API token and IP", () => {
    vi.stubEnv("MANAGEMENT_API_THROTTLE_LIMIT", "2");
    vi.stubEnv("MANAGEMENT_API_THROTTLE_TTL_MS", "60000");
    const guard = new ManagementApiRateLimitGuard();
    const { context, response } = createContext("api-token-id");

    try {
      expect(guard.canActivate(context)).toBe(true);
      expect(guard.canActivate(context)).toBe(true);
      expect(() => guard.canActivate(context)).toThrow(HttpException);
      expect(response.setHeader).toHaveBeenCalledWith("Retry-After", expect.any(String));
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("limits bearer tokens before authentication attaches API token context", () => {
    vi.stubEnv("MANAGEMENT_API_THROTTLE_LIMIT", "1");
    const guard = new ManagementApiRateLimitGuard();
    const { context, response } = createContext(null, "127.0.0.1", "Bearer cf_api_raw_secret");

    try {
      expect(guard.canActivate(context)).toBe(true);
      expect(() => guard.canActivate(context)).toThrow(HttpException);
      expect(response.setHeader).toHaveBeenCalledWith("Retry-After", expect.any(String));
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("shares the pre-auth bearer bucket across different raw tokens from the same IP", () => {
    vi.stubEnv("MANAGEMENT_API_THROTTLE_LIMIT", "1");
    const guard = new ManagementApiRateLimitGuard();
    const first = createContext(null, "127.0.0.1", "Bearer cf_api_first_secret");
    const second = createContext(null, "127.0.0.1", "Bearer cf_api_second_secret");

    try {
      expect(guard.canActivate(first.context)).toBe(true);
      expect(() => guard.canActivate(second.context)).toThrow(HttpException);
      expect(second.response.setHeader).toHaveBeenCalledWith("Retry-After", expect.any(String));
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("tracks different API tokens independently", () => {
    vi.stubEnv("MANAGEMENT_API_THROTTLE_LIMIT", "1");
    const guard = new ManagementApiRateLimitGuard();
    const first = createContext("api-token-one");
    const second = createContext("api-token-two");

    try {
      expect(guard.canActivate(first.context)).toBe(true);
      expect(guard.canActivate(second.context)).toBe(true);
      expect(() => guard.canActivate(first.context)).toThrow(HttpException);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("prefers authenticated API token context over the raw bearer header", () => {
    vi.stubEnv("MANAGEMENT_API_THROTTLE_LIMIT", "1");
    const guard = new ManagementApiRateLimitGuard();
    const first = createContext("api-token-one", "127.0.0.1", "Bearer cf_api_same_secret");
    const second = createContext("api-token-two", "127.0.0.1", "Bearer cf_api_same_secret");

    try {
      expect(guard.canActivate(first.context)).toBe(true);
      expect(guard.canActivate(second.context)).toBe(true);
      expect(() => guard.canActivate(first.context)).toThrow(HttpException);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
