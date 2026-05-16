import { HttpException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { ManagementApiRateLimitGuard } from "../src/api-tokens/management-api-rate-limit.guard";
import { defaultMaxRateLimitBuckets } from "../src/common/fixed-window-rate-limit";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitStoreInspection = {
  buckets: Map<string, RateLimitBucket>;
};

describe("ManagementApiRateLimitGuard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

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

  function rateLimitBuckets(guard: ManagementApiRateLimitGuard) {
    const store = (guard as unknown as { entries: RateLimitStoreInspection }).entries;
    return store.buckets;
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

    expect(guard.canActivate(context)).toBe(true);
    expect(guard.canActivate(context)).toBe(true);
    expect(() => guard.canActivate(context)).toThrow(HttpException);
    expect(response.setHeader).toHaveBeenCalledWith("Retry-After", expect.any(String));
  });

  it("limits bearer tokens before authentication attaches API token context", () => {
    vi.stubEnv("MANAGEMENT_API_THROTTLE_LIMIT", "1");
    const guard = new ManagementApiRateLimitGuard();
    const { context, response } = createContext(null, "127.0.0.1", "Bearer cf_api_raw_secret");

    expect(guard.canActivate(context)).toBe(true);
    expect(() => guard.canActivate(context)).toThrow(HttpException);
    expect(response.setHeader).toHaveBeenCalledWith("Retry-After", expect.any(String));
  });

  it("shares the pre-auth bearer bucket across different raw tokens from the same IP", () => {
    vi.stubEnv("MANAGEMENT_API_THROTTLE_LIMIT", "1");
    const guard = new ManagementApiRateLimitGuard();
    const first = createContext(null, "127.0.0.1", "Bearer cf_api_first_secret");
    const second = createContext(null, "127.0.0.1", "Bearer cf_api_second_secret");

    expect(guard.canActivate(first.context)).toBe(true);
    expect(() => guard.canActivate(second.context)).toThrow(HttpException);
    expect(second.response.setHeader).toHaveBeenCalledWith("Retry-After", expect.any(String));
  });

  it("tracks different API tokens from the same IP independently after authentication", () => {
    vi.stubEnv("MANAGEMENT_API_THROTTLE_LIMIT", "1");
    const guard = new ManagementApiRateLimitGuard();
    const first = createContext("api-token-one");
    const second = createContext("api-token-two");

    expect(guard.canActivate(first.context)).toBe(true);
    expect(guard.canActivate(second.context)).toBe(true);
    expect(() => guard.canActivate(first.context)).toThrow(HttpException);
  });

  it("prefers authenticated API token context over the raw bearer header", () => {
    vi.stubEnv("MANAGEMENT_API_THROTTLE_LIMIT", "1");
    const guard = new ManagementApiRateLimitGuard();
    const first = createContext("api-token-one", "127.0.0.1", "Bearer cf_api_same_secret");
    const second = createContext("api-token-two", "127.0.0.1", "Bearer cf_api_same_secret");

    expect(guard.canActivate(first.context)).toBe(true);
    expect(guard.canActivate(second.context)).toBe(true);
    expect(() => guard.canActivate(first.context)).toThrow(HttpException);
  });

  it("falls back to the default limit when the env value is invalid", () => {
    vi.stubEnv("MANAGEMENT_API_THROTTLE_LIMIT", "not-a-positive-integer");
    const guard = new ManagementApiRateLimitGuard();
    const { context, response } = createContext("api-token-id");

    for (let index = 0; index < 300; index += 1) {
      expect(guard.canActivate(context)).toBe(true);
    }

    expect(() => guard.canActivate(context)).toThrow(HttpException);
    expect(response.setHeader).toHaveBeenCalledWith("Retry-After", expect.any(String));
  });

  it("sets Retry-After from the remaining fixed window", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-15T00:00:00.000Z"));
    vi.stubEnv("MANAGEMENT_API_THROTTLE_LIMIT", "1");
    vi.stubEnv("MANAGEMENT_API_THROTTLE_TTL_MS", "2500");
    const guard = new ManagementApiRateLimitGuard();
    const { context, response } = createContext("api-token-id");

    expect(guard.canActivate(context)).toBe(true);
    expect(() => guard.canActivate(context)).toThrow(HttpException);
    expect(response.setHeader).toHaveBeenCalledWith("Retry-After", "3");
  });

  it("prunes expired buckets before admitting a new bucket", () => {
    const guard = new ManagementApiRateLimitGuard();
    const buckets = rateLimitBuckets(guard);
    buckets.set("expired", { count: 1, resetAt: Date.now() - 1 });
    const { context } = createContext("api-token-id");

    expect(guard.canActivate(context)).toBe(true);
    expect(buckets.has("expired")).toBe(false);
  });

  it("does not add new buckets after the tracked cap is full", () => {
    const guard = new ManagementApiRateLimitGuard();
    const existing = createContext("api-token-existing");
    expect(guard.canActivate(existing.context)).toBe(true);
    const buckets = rateLimitBuckets(guard);
    const resetAt = Date.now() + 60_000;
    for (let index = buckets.size; index < defaultMaxRateLimitBuckets; index += 1) {
      buckets.set(`dummy:${index}`, { count: 1, resetAt });
    }
    const { context, response } = createContext("api-token-new", "198.51.100.1");

    expect(guard.canActivate(existing.context)).toBe(true);
    expect(() => guard.canActivate(context)).toThrow(HttpException);
    expect(buckets.size).toBe(defaultMaxRateLimitBuckets);
    expect(response.setHeader).toHaveBeenCalledWith("Retry-After", "1");
  });

  it("does not retain raw bearer tokens in memory", () => {
    const rawToken = "cf_api_raw_secret";
    const guard = new ManagementApiRateLimitGuard();
    const { context } = createContext(null, "127.0.0.1", `Bearer ${rawToken}`);

    expect(guard.canActivate(context)).toBe(true);

    expect([...rateLimitBuckets(guard).keys()].join(":")).not.toContain(rawToken);
  });
});
