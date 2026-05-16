import { createHash } from "node:crypto";

type FixedWindowRateLimitBucket = {
  count: number;
  resetAt: number;
};

export type FixedWindowRateLimitDecision =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export const defaultMaxRateLimitBuckets = 10_000;

export class FixedWindowRateLimitStore {
  private readonly buckets = new Map<string, FixedWindowRateLimitBucket>();

  constructor(private readonly maxBuckets = defaultMaxRateLimitBuckets) {}

  consume(key: string, now: number, ttlMs: number, limit: number): FixedWindowRateLimitDecision {
    const existing = this.buckets.get(key);

    if (existing && existing.resetAt > now) {
      if (existing.count >= limit) {
        return {
          allowed: false,
          retryAfterSeconds: retryAfterSeconds(existing.resetAt, now),
        };
      }

      existing.count += 1;
      return { allowed: true };
    }

    this.pruneExpired(now);

    if (!this.buckets.has(key) && this.buckets.size >= this.maxBuckets) {
      return { allowed: false, retryAfterSeconds: 1 };
    }

    this.buckets.set(key, { count: 1, resetAt: now + ttlMs });
    return { allowed: true };
  }

  pruneExpired(now: number) {
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }
}

export function positiveIntegerFromEnv(name: string, fallbackValue: number) {
  const parsedValue = Number(process.env[name]);
  return Number.isSafeInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallbackValue;
}

export function retryAfterSeconds(resetAt: number, now: number) {
  return Math.max(1, Math.ceil((resetAt - now) / 1000));
}

export function hashRateLimitValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
