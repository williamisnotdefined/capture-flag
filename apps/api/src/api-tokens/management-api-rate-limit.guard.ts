import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import type { Response } from "express";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import { bearerToken } from "./api-token.guard";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const defaultTtlMs = 60_000;
const defaultLimit = 300;
const maxTrackedEntries = 10_000;

@Injectable()
export class ManagementApiRateLimitGuard implements CanActivate {
  private readonly entries = new Map<string, RateLimitEntry>();

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
    const existing = this.entries.get(key);

    if (!existing || existing.resetAt <= now) {
      this.pruneExpired(now);
      if (!existing && this.entries.size >= maxTrackedEntries) {
        response.setHeader("Retry-After", "1");
        throw new HttpException("Too many API token buckets", HttpStatus.TOO_MANY_REQUESTS);
      }

      this.entries.set(key, { count: 1, resetAt: now + ttlMs });
      return true;
    }

    if (existing.count >= limit) {
      response.setHeader(
        "Retry-After",
        String(Math.max(1, Math.ceil((existing.resetAt - now) / 1000))),
      );
      throw new HttpException("Management API rate limit exceeded", HttpStatus.TOO_MANY_REQUESTS);
    }

    existing.count += 1;
    return true;
  }

  private pruneExpired(now: number) {
    for (const [key, entry] of this.entries) {
      if (entry.resetAt <= now) {
        this.entries.delete(key);
      }
    }
  }

  private bucketKey(request: AuthenticatedRequest) {
    const ip = request.ip ?? request.socket.remoteAddress ?? "unknown";
    if (request.apiToken) {
      return `token:${request.apiToken.id}:${ip}`;
    }

    if (bearerToken(request.headers.authorization)) {
      return `bearer-ip:${ip}`;
    }

    return null;
  }
}

function positiveIntegerFromEnv(name: string, fallbackValue: number) {
  const parsed = Number(process.env[name]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallbackValue;
}
