import { type ExecutionContext, HttpException } from "@nestjs/common";
import type { Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import { ManagementApiRateLimitGuard } from "./management-api-rate-limit.guard";

describe("ManagementApiRateLimitGuard", () => {
  const previousEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...previousEnv };
    vi.restoreAllMocks();
  });

  it("skips requests without bearer credentials", () => {
    process.env.MANAGEMENT_API_THROTTLE_LIMIT = "1";
    const guard = new ManagementApiRateLimitGuard();

    expect(guard.canActivate(contextForRequest({ ip: "127.0.0.1" }))).toBe(true);
    expect(guard.canActivate(contextForRequest({ ip: "127.0.0.1" }))).toBe(true);
  });

  it("limits unauthenticated bearer attempts by IP", () => {
    process.env.MANAGEMENT_API_THROTTLE_LIMIT = "1";
    process.env.MANAGEMENT_API_THROTTLE_TTL_MS = "60000";
    const guard = new ManagementApiRateLimitGuard();
    const response = createResponse();

    expect(
      guard.canActivate(
        contextForRequest({ authorization: "Bearer cf_api_invalid", ip: "198.51.100.2", response }),
      ),
    ).toBe(true);
    expectRateLimit(() =>
      guard.canActivate(
        contextForRequest({ authorization: "Bearer cf_api_invalid", ip: "198.51.100.2", response }),
      ),
    );
    expect(response.setHeader).toHaveBeenCalledWith("Retry-After", "60");
  });

  it("limits authenticated API tokens by token and IP", () => {
    process.env.MANAGEMENT_API_THROTTLE_LIMIT = "1";
    process.env.MANAGEMENT_API_THROTTLE_TTL_MS = "60000";
    const guard = new ManagementApiRateLimitGuard();

    expect(guard.canActivate(contextForRequest({ apiTokenId: "token-1", ip: "203.0.113.5" }))).toBe(
      true,
    );
    expectRateLimit(() =>
      guard.canActivate(contextForRequest({ apiTokenId: "token-1", ip: "203.0.113.5" })),
    );
    expect(guard.canActivate(contextForRequest({ apiTokenId: "token-2", ip: "203.0.113.5" }))).toBe(
      true,
    );
    expect(guard.canActivate(contextForRequest({ apiTokenId: "token-1", ip: "203.0.113.6" }))).toBe(
      true,
    );
  });
});

function expectRateLimit(action: () => unknown) {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).message).toBe("Management API rate limit exceeded");
    expect((error as HttpException).getStatus()).toBe(429);
    return;
  }

  throw new Error("Expected management API rate limit to be exceeded");
}

function contextForRequest(input: {
  apiTokenId?: string;
  authorization?: string;
  ip: string;
  response?: Response;
}): ExecutionContext {
  const request = {
    apiToken: input.apiTokenId ? { id: input.apiTokenId } : undefined,
    headers: { authorization: input.authorization },
    ip: input.ip,
    socket: { remoteAddress: input.ip },
  } as unknown as AuthenticatedRequest;
  const response = input.response ?? createResponse();

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
