import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import type { Response } from "express";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import {
  FixedWindowRateLimitStore,
  hashRateLimitValue,
  positiveIntegerFromEnv,
} from "../common/fixed-window-rate-limit";
import { bearerToken } from "./api-token.guard";

const defaultTtlMs = 60_000;
const defaultLimit = 300;

@Injectable()
export class ManagementApiRateLimitGuard implements CanActivate {
  private readonly entries = new FixedWindowRateLimitStore();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const key = this.bucketKey(request);
    if (!key) {
      return true;
    }

    const now = Date.now();
    const ttlMs = positiveIntegerFromEnv("MANAGEMENT_API_THROTTLE_TTL_MS", defaultTtlMs);
    const limit = positiveIntegerFromEnv("MANAGEMENT_API_THROTTLE_LIMIT", defaultLimit);
    const decision = this.entries.consume(key, now, ttlMs, limit);

    if (decision.allowed) {
      return true;
    }

    response.setHeader("Retry-After", String(decision.retryAfterSeconds));
    throw new HttpException("Management API rate limit exceeded", HttpStatus.TOO_MANY_REQUESTS);
  }

  private bucketKey(request: AuthenticatedRequest) {
    const ip = this.ipRateLimitKey(request);
    if (request.apiToken) {
      return `token:${request.apiToken.id}:${ip}`;
    }

    if (bearerToken(request.headers.authorization)) {
      return `bearer-ip:${ip}`;
    }

    return null;
  }

  private ipRateLimitKey(request: AuthenticatedRequest): string {
    return hashRateLimitValue(request.ip ?? request.socket.remoteAddress ?? "unknown");
  }
}
