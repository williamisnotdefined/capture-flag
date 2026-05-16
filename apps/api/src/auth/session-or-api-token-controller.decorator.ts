import { Controller, UseGuards, applyDecorators } from "@nestjs/common";
import { ApiTokenScopesGuard } from "../api-tokens/api-token-scopes.guard";
import { ApiTokenTenantGuard } from "../api-tokens/api-token-tenant.guard";
import { ManagementApiRateLimitGuard } from "../api-tokens/management-api-rate-limit.guard";
import { AuthenticatedApiGuard } from "./authenticated-api.guard";

export function SessionOrApiTokenController(path: string): ClassDecorator {
  return applyDecorators(
    Controller(path),
    UseGuards(
      ManagementApiRateLimitGuard,
      AuthenticatedApiGuard,
      ManagementApiRateLimitGuard,
      ApiTokenTenantGuard,
      ApiTokenScopesGuard,
    ),
  );
}
