import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Response } from "express";
import { bearerToken } from "../api-tokens/api-token.guard";
import { ApiTokensService } from "../api-tokens/api-tokens.service";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import { SessionsService } from "./sessions.service";

@Injectable()
export class AuthenticatedApiGuard implements CanActivate {
  constructor(
    private readonly sessions: SessionsService,
    private readonly apiTokens: ApiTokensService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const rawApiToken = bearerToken(request.headers.authorization);

    if (rawApiToken) {
      const apiToken = await this.apiTokens.authenticate(rawApiToken);
      if (!apiToken) {
        throw new UnauthorizedException("Invalid API token");
      }

      request.user = {
        id: apiToken.user.id,
        name: apiToken.user.name,
        email: apiToken.user.email,
        avatarUrl: apiToken.user.avatarUrl,
        sessionId: "",
      };
      request.apiToken = {
        id: apiToken.id,
        organizationId: apiToken.organizationId,
        projectId: apiToken.projectId,
        scopes: apiToken.scopes,
        tokenPrefix: apiToken.tokenPrefix,
        userId: apiToken.userId,
      };

      return true;
    }

    const sessionToken = request.cookies?.[this.sessions.cookieName];
    if (!sessionToken) {
      throw new UnauthorizedException("Missing session");
    }

    const session = await this.sessions.findActiveSessionByToken(sessionToken);
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
