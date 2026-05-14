import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Response } from "express";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import { SessionsService } from "./sessions.service";

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessions: SessionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const token = request.cookies?.[this.sessions.cookieName];

    if (!token) {
      throw new UnauthorizedException("Missing session");
    }

    const session = await this.sessions.findActiveSessionByToken(token);
    if (!session) {
      response.clearCookie(this.sessions.cookieName, this.sessions.cookieOptions());
      throw new UnauthorizedException("Invalid session");
    }

    request.user = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      avatarUrl: session.user.avatarUrl,
      sessionId: session.id,
    };

    return true;
  }
}
