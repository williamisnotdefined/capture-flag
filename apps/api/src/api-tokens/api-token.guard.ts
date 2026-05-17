import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import { ApiTokensService } from "./api-tokens.service";

@Injectable()
export class ApiTokenGuard implements CanActivate {
  constructor(private readonly apiTokens: ApiTokensService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const rawToken = bearerToken(request.headers.authorization);

    if (!rawToken) {
      throw new UnauthorizedException("Missing API token");
    }

    const apiToken = await this.apiTokens.authenticate(rawToken);
    if (!apiToken) {
      throw new UnauthorizedException("Invalid API token");
    }

    request.user = {
      id: apiToken.user.id,
      name: apiToken.user.name,
      email: apiToken.user.email,
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
}

export function bearerToken(authorization: string | string[] | undefined) {
  const header = Array.isArray(authorization) ? authorization[0] : authorization;
  if (!header) {
    return null;
  }

  const [scheme, value] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value || header.split(" ").length !== 2) {
    return null;
  }

  return value;
}
