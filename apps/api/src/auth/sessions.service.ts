import { createHash, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import type { CookieOptions } from "express";
import { PrismaService } from "../prisma/prisma.service";

const sessionDurationMs = 1000 * 60 * 60 * 24 * 30;

@Injectable()
export class SessionsService {
  readonly cookieName = process.env.SESSION_COOKIE_NAME ?? "cf_session";

  constructor(private readonly prisma: PrismaService) {}

  hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  async createSession(userId: string) {
    const token = `sess_${randomBytes(32).toString("base64url")}`;
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + sessionDurationMs);

    const session = await this.prisma.session.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      token,
      session,
      expiresAt,
      maxAgeMs: sessionDurationMs,
    };
  }

  cookieOptions(maxAgeMs?: number): CookieOptions {
    const sameSite = this.cookieSameSite();

    return {
      httpOnly: true,
      sameSite,
      secure: sameSite === "none" || process.env.NODE_ENV === "production",
      ...(maxAgeMs === undefined ? {} : { maxAge: maxAgeMs }),
    };
  }

  async findActiveSessionByToken(token: string) {
    const tokenHash = this.hashToken(token);

    return this.prisma.session.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
        user: {
          deletedAt: null,
        },
      },
      include: {
        user: true,
      },
    });
  }

  async revokeToken(token: string) {
    const tokenHash = this.hashToken(token);

    await this.prisma.session.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private cookieSameSite(): "strict" | "lax" | "none" {
    const value = process.env.SESSION_COOKIE_SAME_SITE?.toLowerCase();
    return value === "lax" || value === "none" ? value : "strict";
  }
}
