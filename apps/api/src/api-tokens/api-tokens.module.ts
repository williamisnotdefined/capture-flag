import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AuthenticatedApiGuard } from "../auth/authenticated-api.guard";
import { CommonModule } from "../common/common.module";
import { ApiTokenScopesGuard } from "./api-token-scopes.guard";
import { ApiTokenTenantGuard } from "./api-token-tenant.guard";
import { ApiTokenGuard } from "./api-token.guard";
import { ApiTokensController } from "./api-tokens.controller";
import { ApiTokensService } from "./api-tokens.service";
import { ManagementApiRateLimitGuard } from "./management-api-rate-limit.guard";

@Module({
  imports: [CommonModule, AuthModule],
  controllers: [ApiTokensController],
  providers: [
    ApiTokensService,
    ApiTokenGuard,
    ApiTokenScopesGuard,
    ApiTokenTenantGuard,
    ManagementApiRateLimitGuard,
    AuthenticatedApiGuard,
  ],
  exports: [
    ApiTokensService,
    ApiTokenGuard,
    ApiTokenScopesGuard,
    ApiTokenTenantGuard,
    ManagementApiRateLimitGuard,
    AuthenticatedApiGuard,
  ],
})
export class ApiTokensModule {}
