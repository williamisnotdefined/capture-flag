import { type ExecutionContext, HttpException } from "@nestjs/common";
import type { Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicSdkRateLimitGuard } from "./public-sdk-rate-limit.guard";

describe("PublicSdkRateLimitGuard", () => {
  const previousEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...previousEnv };
    vi.restoreAllMocks();
  });

  it("limits requests by SDK key and IP", () => {
    process.env.PUBLIC_SDK_THROTTLE_LIMIT = "1";
    process.env.PUBLIC_SDK_IP_THROTTLE_LIMIT = "100";
    process.env.PUBLIC_SDK_THROTTLE_TTL_MS = "60000";
    const guard = new PublicSdkRateLimitGuard();

    expect(guard.canActivate(contextForRequest({ ip: "127.0.0.1", sdkKey: "cf_sdk_one" }))).toBe(
      true,
    );
    expectRateLimit(() =>
      guard.canActivate(contextForRequest({ ip: "127.0.0.1", sdkKey: "cf_sdk_one" })),
    );
    expect(guard.canActivate(contextForRequest({ ip: "127.0.0.1", sdkKey: "cf_sdk_two" }))).toBe(
      true,
    );
  });

  it("limits requests by IP before the SDK-key bucket", () => {
    process.env.PUBLIC_SDK_THROTTLE_LIMIT = "100";
    process.env.PUBLIC_SDK_IP_THROTTLE_LIMIT = "1";
    process.env.PUBLIC_SDK_THROTTLE_TTL_MS = "60000";
    const guard = new PublicSdkRateLimitGuard();
    const response = createResponse();

    expect(
      guard.canActivate(contextForRequest({ ip: "203.0.113.10", response, sdkKey: "cf_sdk_one" })),
    ).toBe(true);
    expectRateLimit(() =>
      guard.canActivate(contextForRequest({ ip: "203.0.113.10", response, sdkKey: "cf_sdk_two" })),
    );
    expect(response.setHeader).toHaveBeenCalledWith("Retry-After", "60");
  });
});

function expectRateLimit(action: () => unknown) {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).message).toBe("Too many public SDK config requests");
    expect((error as HttpException).getStatus()).toBe(429);
    return;
  }

  throw new Error("Expected public SDK rate limit to be exceeded");
}

function contextForRequest(input: {
  ip: string;
  response?: Response;
  sdkKey: string;
}): ExecutionContext {
  const response = input.response ?? createResponse();
  const request = {
    ip: input.ip,
    params: { sdkKey: input.sdkKey },
    socket: { remoteAddress: input.ip },
  } as unknown as Request;

  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as ExecutionContext;
}

function createResponse() {
  return {
    setHeader: vi.fn(),
  } as unknown as Response;
}
