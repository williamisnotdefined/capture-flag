import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import {
  corsOrigins,
  isHttpsRequest,
  requireHttpsMiddleware,
  shouldRequireHttps,
  trustProxyValue,
} from "./http-security";

describe("http security helpers", () => {
  it("parses configured CORS origins with CORS_ORIGINS taking precedence", () => {
    expect(
      corsOrigins({
        CLIENT_BASE_URL: "https://client.example.com",
        CORS_ORIGIN: "https://legacy.example.com",
        CORS_ORIGINS: " https://app.example.com, https://admin.example.com ",
      } as NodeJS.ProcessEnv),
    ).toEqual(["https://app.example.com", "https://admin.example.com"]);
  });

  it("uses legacy CORS_ORIGIN when CORS_ORIGINS is absent", () => {
    expect(corsOrigins({ CORS_ORIGIN: "https://legacy.example.com" } as NodeJS.ProcessEnv)).toEqual(
      ["https://legacy.example.com"],
    );
  });

  it("throws in production when no CORS origin is configured", () => {
    expect(() => corsOrigins({ NODE_ENV: "production" } as NodeJS.ProcessEnv)).toThrow(
      "CORS_ORIGINS or CORS_ORIGIN must be configured in production",
    );
  });

  it("requires HTTPS in production and honors explicit local configuration", () => {
    expect(
      shouldRequireHttps({ NODE_ENV: "production", REQUIRE_HTTPS: "false" } as NodeJS.ProcessEnv),
    ).toBe(true);
    expect(shouldRequireHttps({ REQUIRE_HTTPS: "true" } as NodeJS.ProcessEnv)).toBe(true);
    expect(shouldRequireHttps({ REQUIRE_HTTPS: "false" } as NodeJS.ProcessEnv)).toBe(false);
    expect(() => shouldRequireHttps({ REQUIRE_HTTPS: "maybe" } as NodeJS.ProcessEnv)).toThrow(
      "REQUIRE_HTTPS must be a boolean value",
    );
  });

  it("parses trust proxy values", () => {
    expect(trustProxyValue({ API_TRUST_PROXY: "true" } as NodeJS.ProcessEnv)).toBe(true);
    expect(trustProxyValue({ API_TRUST_PROXY: "false" } as NodeJS.ProcessEnv)).toBe(false);
    expect(trustProxyValue({ API_TRUST_PROXY: "2" } as NodeJS.ProcessEnv)).toBe(2);
    expect(trustProxyValue({ API_TRUST_PROXY: "loopback" } as NodeJS.ProcessEnv)).toBe("loopback");
    expect(trustProxyValue({ TRUST_PROXY: "1" } as NodeJS.ProcessEnv)).toBe(true);
  });

  it("detects HTTPS requests and blocks insecure requests when required", () => {
    const next = vi.fn<NextFunction>();
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const response = { status } as unknown as Response;

    expect(isHttpsRequest({ protocol: "https", secure: false } as Request)).toBe(true);
    requireHttpsMiddleware({ protocol: "http", secure: false } as Request, response, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(426);
    expect(json).toHaveBeenCalledWith({
      error: "Upgrade Required",
      message: "HTTPS is required",
      statusCode: 426,
    });

    requireHttpsMiddleware({ protocol: "https", secure: true } as Request, response, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
