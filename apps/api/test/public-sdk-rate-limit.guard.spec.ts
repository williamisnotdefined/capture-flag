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
});
