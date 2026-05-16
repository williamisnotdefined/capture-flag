import { HttpException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { defaultMaxRateLimitBuckets } from "../src/common/fixed-window-rate-limit";
import { PublicSdkRateLimitGuard } from "../src/public-sdk/public-sdk-rate-limit.guard";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitStoreInspection = {
  buckets: Map<string, RateLimitBucket>;
};

describe("PublicSdkRateLimitGuard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  function createContext(sdkKey: string, ip: string) {
    const response = {
      setHeader: vi.fn(),
    };
    const request = {
      ip,
      params: { sdkKey },
      socket: {},
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

  function entriesBuckets(guard: PublicSdkRateLimitGuard) {
    const store = (guard as unknown as { entries: RateLimitStoreInspection }).entries;
    return store.buckets;
  }

  function ipBuckets(guard: PublicSdkRateLimitGuard) {
    const store = (guard as unknown as { ipEntries: RateLimitStoreInspection }).ipEntries;
    return store.buckets;
  }

  it("limits requests by SDK key and IP", () => {
    vi.stubEnv("PUBLIC_SDK_THROTTLE_LIMIT", "2");
    vi.stubEnv("PUBLIC_SDK_THROTTLE_TTL_MS", "60000");
    const guard = new PublicSdkRateLimitGuard();
    const { context, response } = createContext("cf_sdk_raw", "127.0.0.1");

    expect(guard.canActivate(context)).toBe(true);
    expect(guard.canActivate(context)).toBe(true);
    expect(() => guard.canActivate(context)).toThrow(HttpException);
    expect(response.setHeader).toHaveBeenCalledWith("Retry-After", expect.any(String));
  });

  it("does not retain raw SDK keys or raw IP addresses in per-key buckets", () => {
    const guard = new PublicSdkRateLimitGuard();
    const rawSdkKey = "cf_sdk_raw_secret";
    const rawIp = "127.0.0.1";
    const { context } = createContext(rawSdkKey, rawIp);

    expect(guard.canActivate(context)).toBe(true);

    const keys = [...entriesBuckets(guard).keys()].join(":");
    expect(keys).not.toContain(rawSdkKey);
    expect(keys).not.toContain(rawIp);
  });

  it("tracks different SDK keys independently", () => {
    vi.stubEnv("PUBLIC_SDK_THROTTLE_LIMIT", "1");
    const guard = new PublicSdkRateLimitGuard();
    const first = createContext("cf_sdk_one", "127.0.0.1");
    const second = createContext("cf_sdk_two", "127.0.0.1");

    expect(guard.canActivate(first.context)).toBe(true);
    expect(guard.canActivate(second.context)).toBe(true);
    expect(() => guard.canActivate(first.context)).toThrow(HttpException);
  });

  it("keeps per-key buckets independent while the IP quota is below limit", () => {
    vi.stubEnv("PUBLIC_SDK_THROTTLE_LIMIT", "1");
    const guard = new PublicSdkRateLimitGuard();
    const first = createContext("cf_sdk_one", "127.0.0.1");
    const second = createContext("cf_sdk_two", "127.0.0.1");
    const third = createContext("cf_sdk_three", "127.0.0.1");

    expect(guard.canActivate(first.context)).toBe(true);
    expect(guard.canActivate(second.context)).toBe(true);
    expect(guard.canActivate(third.context)).toBe(true);
  });

  it("limits key-spray by IP across different SDK keys", () => {
    vi.stubEnv("PUBLIC_SDK_THROTTLE_LIMIT", "10");
    vi.stubEnv("PUBLIC_SDK_IP_THROTTLE_LIMIT", "2");
    const guard = new PublicSdkRateLimitGuard();
    const first = createContext("cf_sdk_one", "127.0.0.1");
    const second = createContext("cf_sdk_two", "127.0.0.1");
    const third = createContext("cf_sdk_three", "127.0.0.1");

    expect(guard.canActivate(first.context)).toBe(true);
    expect(guard.canActivate(second.context)).toBe(true);
    expect(() => guard.canActivate(third.context)).toThrow(HttpException);
    expect(third.response.setHeader).toHaveBeenCalledWith("Retry-After", expect.any(String));
  });

  it("does not retain raw IP addresses in the IP quota map", () => {
    const guard = new PublicSdkRateLimitGuard();
    const { context } = createContext("cf_sdk_raw", "203.0.113.10");

    expect(guard.canActivate(context)).toBe(true);

    expect([...ipBuckets(guard).keys()][0]).not.toContain("203.0.113.10");
  });

  it("falls back to the default per-key limit when the env value is invalid", () => {
    vi.stubEnv("PUBLIC_SDK_THROTTLE_LIMIT", "not-a-positive-integer");
    vi.stubEnv("PUBLIC_SDK_IP_THROTTLE_LIMIT", "6000");
    const guard = new PublicSdkRateLimitGuard();
    const { context, response } = createContext("cf_sdk_raw", "127.0.0.1");

    for (let index = 0; index < 600; index += 1) {
      expect(guard.canActivate(context)).toBe(true);
    }

    expect(() => guard.canActivate(context)).toThrow(HttpException);
    expect(response.setHeader).toHaveBeenCalledWith("Retry-After", expect.any(String));
  });

  it("sets Retry-After from the remaining fixed window", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-15T00:00:00.000Z"));
    vi.stubEnv("PUBLIC_SDK_THROTTLE_LIMIT", "1");
    vi.stubEnv("PUBLIC_SDK_THROTTLE_TTL_MS", "2500");
    const guard = new PublicSdkRateLimitGuard();
    const { context, response } = createContext("cf_sdk_raw", "127.0.0.1");

    expect(guard.canActivate(context)).toBe(true);
    expect(() => guard.canActivate(context)).toThrow(HttpException);
    expect(response.setHeader).toHaveBeenCalledWith("Retry-After", "3");
  });

  it("does not add new SDK key buckets after the tracked cap is full", () => {
    const guard = new PublicSdkRateLimitGuard();
    const existing = createContext("cf_sdk_existing", "127.0.0.1");
    expect(guard.canActivate(existing.context)).toBe(true);
    const entries = entriesBuckets(guard);
    const resetAt = Date.now() + 60_000;
    for (let index = entries.size; index < defaultMaxRateLimitBuckets; index += 1) {
      entries.set(`dummy:${index}`, { count: 1, resetAt });
    }
    const { context, response } = createContext("cf_sdk_raw", "198.51.100.1");

    expect(guard.canActivate(existing.context)).toBe(true);
    expect(() => guard.canActivate(context)).toThrow(HttpException);
    expect(entries.size).toBe(defaultMaxRateLimitBuckets);
    expect(response.setHeader).toHaveBeenCalledWith("Retry-After", "1");
  });

  it("prunes expired IP buckets before enforcing the tracked cap", () => {
    const guard = new PublicSdkRateLimitGuard();
    const existing = createContext("cf_sdk_existing", "127.0.0.1");
    expect(guard.canActivate(existing.context)).toBe(true);
    const ipEntries = ipBuckets(guard);
    const expiredAt = Date.now() - 1;
    for (let index = ipEntries.size; index < defaultMaxRateLimitBuckets; index += 1) {
      ipEntries.set(`dummy:${index}`, { count: 1, resetAt: expiredAt });
    }
    const { context } = createContext("cf_sdk_raw", "198.51.100.1");

    expect(guard.canActivate(context)).toBe(true);
    expect(ipEntries.size).toBe(2);
    expect([...ipEntries.keys()].some((key) => key.startsWith("dummy:"))).toBe(false);
  });
});
