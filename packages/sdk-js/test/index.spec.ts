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
  const headers = new Headers(init?.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  return new Response(JSON.stringify(body), {
    status: 200,
    ...init,
    headers,
  });
}

function createBooleanConfig(defaultValue: boolean): CaptureFlagConfig {
  return createConfig({
    flags: {
      newCheckout: {
        defaultValue,
        percentageAttribute: "identifier",
        percentageOptions: [],
        rules: [],
        type: "boolean",
      },
    },
  });
}

function createLocalStorageMock(initialValues: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initialValues));

  return {
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
    get length() {
      return values.size;
    },
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
  } as Storage;
}

describe("createClient", () => {
  afterEach(() => {
    vi.useRealTimers();
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

  it("sends If-None-Match when cached ETag exists", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(createBooleanConfig(true), { headers: { etag: '"rev-1"' } }),
      )
      .mockResolvedValueOnce(
        jsonResponse(createBooleanConfig(false), { headers: { etag: '"rev-2"' } }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const client = createClient({
      baseUrl: "https://flags.example.com",
      sdkKey: "cf_sdk_raw",
    });

    await expect(client.getValue("newCheckout", false)).resolves.toBe(true);
    await client.refresh();

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://flags.example.com/public/sdk/cf_sdk_raw/config",
      {
        headers: {
          "If-None-Match": '"rev-1"',
        },
      },
    );
    await expect(client.getValue("newCheckout", true)).resolves.toBe(false);
  });

  it("handles 304 Not Modified without reprocessing config", async () => {
    const notModifiedResponse = new Response(null, {
      headers: { etag: '"rev-1"' },
      status: 304,
    });
    const jsonSpy = vi.spyOn(notModifiedResponse, "json");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(createBooleanConfig(true), { headers: { etag: '"rev-1"' } }),
      )
      .mockResolvedValueOnce(notModifiedResponse);
    vi.stubGlobal("fetch", fetchMock);

    const client = createClient({
      baseUrl: "https://flags.example.com",
      sdkKey: "cf_sdk_raw",
    });

    await expect(client.getValue("newCheckout", false)).resolves.toBe(true);
    await client.refresh();

    expect(jsonSpy).not.toHaveBeenCalled();
    await expect(client.getValue("newCheckout", false)).resolves.toBe(true);
  });

  it("keeps cached config when refresh fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(createBooleanConfig(true), { headers: { etag: '"rev-1"' } }),
      )
      .mockRejectedValueOnce(new Error("network unavailable"));
    vi.stubGlobal("fetch", fetchMock);

    const client = createClient({
      baseUrl: "https://flags.example.com",
      sdkKey: "cf_sdk_raw",
    });

    await expect(client.getValue("newCheckout", false)).resolves.toBe(true);
    await client.refresh();

    await expect(client.getValue("newCheckout", false)).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps cached config when refresh returns invalid flag data", async () => {
    const invalidConfig = createBooleanConfig(false);
    invalidConfig.flags.newCheckout.defaultValue = "not-a-boolean";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(createBooleanConfig(true), { headers: { etag: '"rev-1"' } }),
      )
      .mockResolvedValueOnce(jsonResponse(invalidConfig, { headers: { etag: '"rev-2"' } }));
    vi.stubGlobal("fetch", fetchMock);

    const client = createClient({
      baseUrl: "https://flags.example.com",
      sdkKey: "cf_sdk_raw",
    });

    await expect(client.getValue("newCheckout", false)).resolves.toBe(true);
    await client.refresh();

    await expect(client.getValue("newCheckout", false)).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("manual mode updates only when refresh is called", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(createBooleanConfig(true)));
    vi.stubGlobal("fetch", fetchMock);

    const client = createClient({
      baseUrl: "https://flags.example.com",
      mode: "manual",
      sdkKey: "cf_sdk_raw",
    });

    await expect(client.getValue("newCheckout", false)).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();

    await client.refresh();

    await expect(client.getValue("newCheckout", false)).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("lazy loading respects cache TTL", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-12T00:00:00.000Z"));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(createBooleanConfig(true), { headers: { etag: '"rev-1"' } }),
      )
      .mockResolvedValueOnce(
        jsonResponse(createBooleanConfig(false), { headers: { etag: '"rev-2"' } }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const client = createClient({
      baseUrl: "https://flags.example.com",
      cacheTtlMs: 1_000,
      sdkKey: "cf_sdk_raw",
    });

    await expect(client.getValue("newCheckout", false)).resolves.toBe(true);
    vi.advanceTimersByTime(999);
    await expect(client.getValue("newCheckout", false)).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    await expect(client.getValue("newCheckout", true)).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("auto polling refreshes config and close stops polling", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-12T00:00:00.000Z"));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(createBooleanConfig(true), { headers: { etag: '"rev-1"' } }),
      )
      .mockResolvedValueOnce(
        jsonResponse(createBooleanConfig(false), { headers: { etag: '"rev-2"' } }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const client = createClient({
      baseUrl: "https://flags.example.com",
      mode: "auto",
      pollIntervalMs: 1_000,
      sdkKey: "cf_sdk_raw",
    });

    await expect(client.getValue("newCheckout", false)).resolves.toBe(true);
    await vi.advanceTimersByTimeAsync(1_000);
    await expect(client.getValue("newCheckout", true)).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    client.close();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("offline mode uses localStorage cache without network", async () => {
    const cacheKey = "capture-flag:test";
    const localStorage = createLocalStorageMock({
      [cacheKey]: JSON.stringify({
        cachedAt: Date.parse("2026-05-12T00:00:00.000Z"),
        config: createBooleanConfig(true),
        etag: '"rev-1"',
        schemaVersion: 1,
      }),
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("localStorage", localStorage);

    const client = createClient({
      baseUrl: "https://flags.example.com",
      cache: "localStorage",
      localStorageKey: cacheKey,
      mode: "offline",
      sdkKey: "cf_sdk_raw",
    });

    await expect(client.getValue("newCheckout", false)).resolves.toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ignores invalid localStorage cache", async () => {
    const localStorage = createLocalStorageMock({
      "capture-flag:test": "not-json",
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("localStorage", localStorage);

    const client = createClient({
      baseUrl: "https://flags.example.com",
      cache: "localStorage",
      localStorageKey: "capture-flag:test",
      mode: "offline",
      sdkKey: "cf_sdk_raw",
    });

    await expect(client.getValue("newCheckout", false)).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
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

  it("returns fallback when the caller fallback does not match the flag type", async () => {
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

    await expect(client.getValue("newCheckout", "fallback")).resolves.toBe("fallback");
  });
});
