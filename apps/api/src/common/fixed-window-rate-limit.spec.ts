import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  FixedWindowRateLimitStore,
  hashRateLimitValue,
  positiveIntegerFromEnv,
  retryAfterSeconds,
} from "./fixed-window-rate-limit";

describe("FixedWindowRateLimitStore", () => {
  it("allows requests up to the limit and rejects excess requests until reset", () => {
    const store = new FixedWindowRateLimitStore();

    expect(store.consume("sdk-key", 1_000, 1_000, 2)).toEqual({ allowed: true });
    expect(store.consume("sdk-key", 1_100, 1_000, 2)).toEqual({ allowed: true });
    expect(store.consume("sdk-key", 1_200, 1_000, 2)).toEqual({
      allowed: false,
      retryAfterSeconds: 1,
    });
    expect(store.consume("sdk-key", 2_000, 1_000, 2)).toEqual({ allowed: true });
  });

  it("keeps independent buckets and rejects new buckets when capacity is exhausted", () => {
    const store = new FixedWindowRateLimitStore(1);

    expect(store.consume("first", 1_000, 1_000, 10)).toEqual({ allowed: true });
    expect(store.consume("second", 1_100, 1_000, 10)).toEqual({
      allowed: false,
      retryAfterSeconds: 1,
    });
    expect(store.consume("second", 2_000, 1_000, 10)).toEqual({ allowed: true });
  });
});

describe("rate limit helpers", () => {
  it("parses positive integer environment values", () => {
    const previousValue = process.env.TEST_RATE_LIMIT;
    process.env.TEST_RATE_LIMIT = "25";
    expect(positiveIntegerFromEnv("TEST_RATE_LIMIT", 10)).toBe(25);

    process.env.TEST_RATE_LIMIT = "0";
    expect(positiveIntegerFromEnv("TEST_RATE_LIMIT", 10)).toBe(10);

    process.env.TEST_RATE_LIMIT = "abc";
    expect(positiveIntegerFromEnv("TEST_RATE_LIMIT", 10)).toBe(10);

    if (previousValue === undefined) {
      process.env.TEST_RATE_LIMIT = undefined;
    } else {
      process.env.TEST_RATE_LIMIT = previousValue;
    }
  });

  it("hashes bucket input and computes retry-after seconds", () => {
    expect(hashRateLimitValue("raw-token")).toBe(
      createHash("sha256").update("raw-token").digest("hex"),
    );
    expect(retryAfterSeconds(2_500, 1_001)).toBe(2);
    expect(retryAfterSeconds(1_000, 1_000)).toBe(1);
  });
});
