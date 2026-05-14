import { HttpException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { PublicSdkRateLimitGuard } from "../src/public-sdk/public-sdk-rate-limit.guard";

describe("PublicSdkRateLimitGuard", () => {
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

  it("limits requests by SDK key and IP", () => {
    vi.stubEnv("PUBLIC_SDK_THROTTLE_LIMIT", "2");
    vi.stubEnv("PUBLIC_SDK_THROTTLE_TTL_MS", "60000");
    const guard = new PublicSdkRateLimitGuard();
    const { context, response } = createContext("cf_sdk_raw", "127.0.0.1");

    try {
      expect(guard.canActivate(context)).toBe(true);
      expect(guard.canActivate(context)).toBe(true);
      expect(() => guard.canActivate(context)).toThrow(HttpException);
      expect(response.setHeader).toHaveBeenCalledWith("Retry-After", expect.any(String));
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("does not retain raw SDK keys in memory", () => {
    const guard = new PublicSdkRateLimitGuard();
    const { context } = createContext("cf_sdk_raw_secret", "127.0.0.1");

    expect(guard.canActivate(context)).toBe(true);

    const entries = (guard as unknown as { entries: Map<string, unknown> }).entries;
    expect([...entries.keys()][0]).not.toContain("cf_sdk_raw_secret");
  });

  it("tracks different SDK keys independently", () => {
    vi.stubEnv("PUBLIC_SDK_THROTTLE_LIMIT", "1");
    const guard = new PublicSdkRateLimitGuard();
    const first = createContext("cf_sdk_one", "127.0.0.1");
    const second = createContext("cf_sdk_two", "127.0.0.1");

    try {
      expect(guard.canActivate(first.context)).toBe(true);
      expect(guard.canActivate(second.context)).toBe(true);
      expect(() => guard.canActivate(first.context)).toThrow(HttpException);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("limits high-cardinality SDK key attempts from one IP", () => {
    vi.stubEnv("PUBLIC_SDK_THROTTLE_LIMIT", "1");
    vi.stubEnv("PUBLIC_SDK_IP_THROTTLE_LIMIT", "2");
    const guard = new PublicSdkRateLimitGuard();
    const first = createContext("cf_sdk_one", "127.0.0.1");
    const second = createContext("cf_sdk_two", "127.0.0.1");
    const third = createContext("cf_sdk_three", "127.0.0.1");

    try {
      expect(guard.canActivate(first.context)).toBe(true);
      expect(guard.canActivate(second.context)).toBe(true);
      expect(() => guard.canActivate(third.context)).toThrow(HttpException);
      expect(third.response.setHeader).toHaveBeenCalledWith("Retry-After", expect.any(String));
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("does not add new IP buckets after the tracked IP cap is full", () => {
    const guard = new PublicSdkRateLimitGuard();
    const ipEntries = (
      guard as unknown as {
        ipEntries: Map<string, { count: number; resetAt: number }>;
      }
    ).ipEntries;
    const resetAt = Date.now() + 60_000;
    for (let index = 0; index < 10_000; index += 1) {
      ipEntries.set(`192.0.2.${index}`, { count: 1, resetAt });
    }
    const { context, response } = createContext("cf_sdk_raw", "198.51.100.1");

    expect(() => guard.canActivate(context)).toThrow(HttpException);
    expect(ipEntries.size).toBe(10_000);
    expect(response.setHeader).toHaveBeenCalledWith("Retry-After", "1");
  });
});
