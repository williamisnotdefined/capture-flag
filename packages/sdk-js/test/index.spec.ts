import type { CaptureFlagConfig } from "@capture-flag/evaluator";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient } from "../src";

function createConfig(overrides: Partial<CaptureFlagConfig> = {}): CaptureFlagConfig {
  return {
    configKey: "frontend-web",
    environment: "production",
    flags: {
      newCheckout: {
        defaultValue: false,
        percentageAttribute: "identifier",
        percentageOptions: [],
        rules: [],
        type: "boolean",
      },
    },
    generatedAt: "2026-05-12T00:00:00.000Z",
    projectKey: "ecommerce",
    revision: 1,
    schemaVersion: 1,
    ...overrides,
  };
}

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status: 200,
    ...init,
  });
}

describe("createClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches remote config and evaluates locally with context", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        createConfig({
          flags: {
            newCheckout: {
              defaultValue: false,
              percentageAttribute: "identifier",
              percentageOptions: [],
              rules: [
                {
                  conditions: [{ attribute: "country", operator: "equals", value: "BR" }],
                  serve: true,
                },
              ],
              type: "boolean",
            },
          },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = createClient({
      baseUrl: "https://flags.example.com",
      sdkKey: "cf_sdk_raw",
    });

    await expect(client.getValue("newCheckout", false, { country: "BR" })).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://flags.example.com/public/sdk/cf_sdk_raw/config",
    );
  });

  it("does not send evaluation context to the public config API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(createConfig()));
    vi.stubGlobal("fetch", fetchMock);

    const client = createClient({
      baseUrl: "https://flags.example.com",
      sdkKey: "cf_sdk_raw",
    });

    await client.getValue("newCheckout", false, { email: "user@example.com" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://flags.example.com/public/sdk/cf_sdk_raw/config",
    );
  });

  it("uses in-memory cache after the first successful fetch", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        createConfig({
          flags: {
            newCheckout: {
              defaultValue: true,
              percentageAttribute: "identifier",
              percentageOptions: [],
              rules: [],
              type: "boolean",
            },
          },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = createClient({
      baseUrl: "https://flags.example.com",
      sdkKey: "cf_sdk_raw",
    });

    await expect(client.getValue("newCheckout", false)).resolves.toBe(true);
    await expect(client.getValue("newCheckout", false)).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns fallback when the request fails", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network unavailable"));
    vi.stubGlobal("fetch", fetchMock);

    const client = createClient({
      baseUrl: "https://flags.example.com",
      sdkKey: "cf_sdk_raw",
    });

    await expect(client.getValue("newCheckout", false)).resolves.toBe(false);
  });

  it("returns fallback when the response is not ok", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ error: "not found" }, { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);

    const client = createClient({
      baseUrl: "https://flags.example.com",
      sdkKey: "cf_sdk_raw",
    });

    await expect(client.getValue("newCheckout", false)).resolves.toBe(false);
  });

  it("returns fallback when the config JSON is invalid", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ schemaVersion: 2 }));
    vi.stubGlobal("fetch", fetchMock);

    const client = createClient({
      baseUrl: "https://flags.example.com",
      sdkKey: "cf_sdk_raw",
    });

    await expect(client.getValue("newCheckout", false)).resolves.toBe(false);
  });
});
