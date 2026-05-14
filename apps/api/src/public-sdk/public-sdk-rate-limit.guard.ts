import { createHash } from "node:crypto";
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import type { Request, Response } from "express";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const defaultRateLimitTtlMs = 60_000;
const defaultRateLimitMax = 600;
const maxTrackedKeysBeforeCleanup = 10_000;

@Injectable()
export class PublicSdkRateLimitGuard implements CanActivate {
  private readonly entries = new Map<string, RateLimitEntry>();
  private readonly ipEntries = new Map<string, RateLimitEntry>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const now = Date.now();
    const ttlMs = this.positiveIntegerOrDefault(
      process.env.PUBLIC_SDK_THROTTLE_TTL_MS,
      defaultRateLimitTtlMs,
    );
    const maxRequests = this.positiveIntegerOrDefault(
      process.env.PUBLIC_SDK_THROTTLE_LIMIT,
      defaultRateLimitMax,
    );
    const maxIpRequests = this.positiveIntegerOrDefault(
      process.env.PUBLIC_SDK_IP_THROTTLE_LIMIT,
      maxRequests * 10,
    );
    const ipKey = this.ipRateLimitKey(request);
    this.ensureTrackingCapacity(this.ipEntries, ipKey, now, response);
    this.consumeRateLimitEntry(this.ipEntries, ipKey, now, ttlMs, maxIpRequests, response);

    const key = this.rateLimitKey(request);
    this.ensureTrackingCapacity(this.entries, key, now, response);
    this.consumeRateLimitEntry(this.entries, key, now, ttlMs, maxRequests, response);
    return true;
  }

  private rateLimitKey(request: Request): string {
    const sdkKey = typeof request.params.sdkKey === "string" ? request.params.sdkKey : "unknown";

    return `${this.hashRateLimitCredential(sdkKey)}:${this.ipRateLimitKey(request)}`;
  }

  private ipRateLimitKey(request: Request): string {
    return request.ip || request.socket.remoteAddress || "unknown";
  }

  private hashRateLimitCredential(value: string): string {
    return createHash("sha256").update(value).digest("hex");
  }

  private cleanupExpiredEntries(now: number) {
    for (const [key, entry] of this.entries) {
      if (entry.resetAt <= now) {
        this.entries.delete(key);
      }
    }

    for (const [key, entry] of this.ipEntries) {
      if (entry.resetAt <= now) {
        this.ipEntries.delete(key);
      }
    }
  }

  private ensureTrackingCapacity(
    entries: Map<string, RateLimitEntry>,
    key: string,
    now: number,
    response: Response,
  ) {
    if (entries.size < maxTrackedKeysBeforeCleanup || entries.has(key)) {
      return;
    }

    this.cleanupExpiredEntries(now);

    if (entries.size >= maxTrackedKeysBeforeCleanup && !entries.has(key)) {
      response.setHeader("Retry-After", "1");
      throw new HttpException("Too many public SDK config requests", HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private consumeRateLimitEntry(
    entries: Map<string, RateLimitEntry>,
    key: string,
    now: number,
    ttlMs: number,
    maxRequests: number,
    response: Response,
  ) {
    const existingEntry = entries.get(key);
    if (!existingEntry || existingEntry.resetAt <= now) {
      entries.set(key, {
        count: 1,
        resetAt: now + ttlMs,
      });
      return;
    }

    existingEntry.count += 1;
    if (existingEntry.count <= maxRequests) {
      return;
    }

    const retryAfterSeconds = Math.max(1, Math.ceil((existingEntry.resetAt - now) / 1000));
    response.setHeader("Retry-After", String(retryAfterSeconds));
    throw new HttpException("Too many public SDK config requests", HttpStatus.TOO_MANY_REQUESTS);
  }

  private positiveIntegerOrDefault(value: string | undefined, fallbackValue: number): number {
    const parsedValue = Number(value);
    return Number.isSafeInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallbackValue;
  }
}
