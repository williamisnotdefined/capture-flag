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
    const key = this.rateLimitKey(request);
    const existingEntry = this.entries.get(key);

    if (this.entries.size > maxTrackedKeysBeforeCleanup) {
      this.cleanupExpiredEntries(now);
    }

    if (!existingEntry || existingEntry.resetAt <= now) {
      this.entries.set(key, {
        count: 1,
        resetAt: now + ttlMs,
      });
      return true;
    }

    existingEntry.count += 1;
    if (existingEntry.count <= maxRequests) {
      return true;
    }

    const retryAfterSeconds = Math.max(1, Math.ceil((existingEntry.resetAt - now) / 1000));
    response.setHeader("Retry-After", String(retryAfterSeconds));
    throw new HttpException("Too many public SDK config requests", HttpStatus.TOO_MANY_REQUESTS);
  }

  private rateLimitKey(request: Request): string {
    const sdkKey = typeof request.params.sdkKey === "string" ? request.params.sdkKey : "unknown";
    const ip = request.ip || request.socket.remoteAddress || "unknown";

    return `${sdkKey}:${ip}`;
  }

  private cleanupExpiredEntries(now: number) {
    for (const [key, entry] of this.entries) {
      if (entry.resetAt <= now) {
        this.entries.delete(key);
      }
    }
  }

  private positiveIntegerOrDefault(value: string | undefined, fallbackValue: number): number {
    const parsedValue = Number(value);
    return Number.isSafeInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallbackValue;
  }
}
