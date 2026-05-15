import type { NextFunction, Request, Response } from "express";
import {
  corsOrigins,
  isHttpsRequest,
  requireHttpsMiddleware,
  shouldRequireHttps,
  trustProxyValue,
} from "../src/security/http-security";

describe("HTTP security configuration", () => {
  it("uses the local client origin outside production when CORS is not configured", () => {
    expect(corsOrigins({ NODE_ENV: "development" } as NodeJS.ProcessEnv)).toEqual([
      "http://localhost:5173",
    ]);
  });

  it("requires explicit CORS origins in production", () => {
    expect(() => corsOrigins({ NODE_ENV: "production" } as NodeJS.ProcessEnv)).toThrow(
      "CORS_ORIGINS or CORS_ORIGIN must be configured in production",
    );
  });

  it("parses comma-separated CORS origins", () => {
    expect(
      corsOrigins({
        CORS_ORIGINS: "https://app.example.com, https://admin.example.com",
      } as NodeJS.ProcessEnv),
    ).toEqual(["https://app.example.com", "https://admin.example.com"]);
  });

  it("requires HTTPS by default only in production", () => {
    expect(shouldRequireHttps({ NODE_ENV: "production" } as NodeJS.ProcessEnv)).toBe(true);
    expect(shouldRequireHttps({ NODE_ENV: "development" } as NodeJS.ProcessEnv)).toBe(false);
    expect(
      shouldRequireHttps({ NODE_ENV: "development", REQUIRE_HTTPS: "true" } as NodeJS.ProcessEnv),
    ).toBe(true);
    expect(
      shouldRequireHttps({ NODE_ENV: "production", REQUIRE_HTTPS: "false" } as NodeJS.ProcessEnv),
    ).toBe(true);
  });

  it("parses trust proxy values", () => {
    expect(trustProxyValue({ API_TRUST_PROXY: "true" } as NodeJS.ProcessEnv)).toBe(true);
    expect(trustProxyValue({ API_TRUST_PROXY: "2" } as NodeJS.ProcessEnv)).toBe(2);
    expect(trustProxyValue({ API_TRUST_PROXY: "loopback" } as NodeJS.ProcessEnv)).toBe("loopback");
  });

  it("detects HTTPS from Express metadata", () => {
    expect(isHttpsRequest(createRequest({ secure: true }))).toBe(true);
    expect(isHttpsRequest(createRequest({ protocol: "https" }))).toBe(true);
    expect(isHttpsRequest(createRequest({ forwardedProto: "https" }))).toBe(false);
  });

  it("rejects insecure requests when HTTPS middleware is active", () => {
    const response = createResponse();
    const next = vi.fn() as NextFunction;

    requireHttpsMiddleware(createRequest(), response, next);

    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(426);
    expect(response.json).toHaveBeenCalledWith({
      error: "Upgrade Required",
      message: "HTTPS is required",
      statusCode: 426,
    });
  });

  it("allows secure requests through HTTPS middleware", () => {
    const response = createResponse();
    const next = vi.fn() as NextFunction;

    requireHttpsMiddleware(createRequest({ protocol: "https" }), response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(response.status).not.toHaveBeenCalled();
  });
});

function createRequest(
  input: { forwardedProto?: string; protocol?: string; secure?: boolean } = {},
): Request {
  return {
    headers: input.forwardedProto ? { "x-forwarded-proto": input.forwardedProto } : {},
    protocol: input.protocol ?? "http",
    secure: input.secure ?? false,
  } as Request;
}

function createResponse(): Response {
  const response = {
    json: vi.fn(),
    status: vi.fn(),
  };
  response.status.mockReturnValue(response);

  return response as unknown as Response;
}
