import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import type { Request, Response } from "express";
import {
  FixedWindowRateLimitStore,
  hashRateLimitValue,
  positiveIntegerFromEnv,
} from "../common/fixed-window-rate-limit";

const defaultRateLimitTtlMs = 60_000;
const defaultRateLimitMax = 600;
const defaultIpRateLimitMax = 6_000;

@Injectable()
export class PublicSdkRateLimitGuard implements CanActivate {
  private readonly entries = new FixedWindowRateLimitStore();
  private readonly ipEntries = new FixedWindowRateLimitStore();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const now = Date.now();
    const ttlMs = positiveIntegerFromEnv("PUBLIC_SDK_THROTTLE_TTL_MS", defaultRateLimitTtlMs);
    const maxRequests = positiveIntegerFromEnv("PUBLIC_SDK_THROTTLE_LIMIT", defaultRateLimitMax);
    const maxIpRequests = positiveIntegerFromEnv(
      "PUBLIC_SDK_IP_THROTTLE_LIMIT",
      defaultIpRateLimitMax,
    );
    const key = this.rateLimitKey(request);
    const ipKey = this.ipOnlyRateLimitKey(request);

    this.enforceRateLimit(
      this.ipEntries.consume(ipKey, now, ttlMs, maxIpRequests),
      response,
    );
    this.enforceRateLimit(this.entries.consume(key, now, ttlMs, maxRequests), response);
    return true;
  }

  private rateLimitKey(request: Request): string {
    const sdkKey = typeof request.params.sdkKey === "string" ? request.params.sdkKey : "unknown";

    return `${hashRateLimitValue(sdkKey)}:${this.ipRateLimitKey(request)}`;
  }

  private ipRateLimitKey(request: Request): string {
    return hashRateLimitValue(request.ip || request.socket.remoteAddress || "unknown");
  }

  private ipOnlyRateLimitKey(request: Request): string {
    return `ip:${this.ipRateLimitKey(request)}`;
  }

  private enforceRateLimit(
    decision: ReturnType<FixedWindowRateLimitStore["consume"]>,
    response: Response,
  ) {
    if (decision.allowed) {
      return;
    }

    response.setHeader("Retry-After", String(decision.retryAfterSeconds));
    throw new HttpException("Too many public SDK config requests", HttpStatus.TOO_MANY_REQUESTS);
  }
}
