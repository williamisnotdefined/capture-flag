import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { ApiTokenScope } from "../common/api-token-scopes";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import { apiTokenScopesMetadataKey } from "./api-token-scopes.decorator";

@Injectable()
export class ApiTokenScopesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.apiToken) {
      return true;
    }

    const requiredScopes = this.reflector.getAllAndOverride<ApiTokenScope[]>(
      apiTokenScopesMetadataKey,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredScopes || requiredScopes.length === 0) {
      throw new ForbiddenException("API token is not allowed for this route");
    }

    const grantedScopes = new Set(request.apiToken.scopes);
    if (requiredScopes.every((scope) => grantedScopes.has(scope))) {
      return true;
    }

    throw new ForbiddenException("API token scope is not allowed for this action");
  }
}
