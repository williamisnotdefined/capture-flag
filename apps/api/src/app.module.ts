import { Module } from "@nestjs/common";
import { ApiTokenScopesGuard } from "./api-tokens/api-token-scopes.guard";
import { ApiTokenTenantGuard } from "./api-tokens/api-token-tenant.guard";
import { ApiTokenGuard } from "./api-tokens/api-token.guard";
import { ApiTokensController } from "./api-tokens/api-tokens.controller";
import { ApiTokensService } from "./api-tokens/api-tokens.service";
import { ManagementApiRateLimitGuard } from "./api-tokens/management-api-rate-limit.guard";
import { AuditLogsController } from "./audit-logs/audit-logs.controller";
import { AuditLogsService } from "./audit-logs/audit-logs.service";
import { AuthController } from "./auth/auth.controller";
import { AuthenticatedApiGuard } from "./auth/authenticated-api.guard";
import { GithubAuthService } from "./auth/github-auth.service";
import { SessionGuard } from "./auth/session.guard";
import { SessionsService } from "./auth/sessions.service";
import { CommonModule } from "./common/common.module";
import { ConfigsController } from "./configs/configs.controller";
import { ConfigsService } from "./configs/configs.service";
import { EnvironmentsController } from "./environments/environments.controller";
import { EnvironmentsService } from "./environments/environments.service";
import { FeatureFlagsModule } from "./feature-flags/feature-flags.module";
import { HealthController } from "./health/health.controller";
import { ManagementApiController } from "./management-api/management-api.controller";
import { ManagementApiService } from "./management-api/management-api.service";
import { OrganizationsController } from "./organizations/organizations.controller";
import { OrganizationsService } from "./organizations/organizations.service";
import { ProjectsController } from "./projects/projects.controller";
import { ProjectsService } from "./projects/projects.service";
import { PublicSdkRateLimitGuard } from "./public-sdk/public-sdk-rate-limit.guard";
import { PublicSdkController } from "./public-sdk/public-sdk.controller";
import { PublicSdkService } from "./public-sdk/public-sdk.service";
import { SdkKeysController } from "./sdk-keys/sdk-keys.controller";
import { SdkKeysService } from "./sdk-keys/sdk-keys.service";
import { SegmentsController } from "./segments/segments.controller";
import { SegmentsService } from "./segments/segments.service";

@Module({
  imports: [CommonModule, FeatureFlagsModule],
  controllers: [
    HealthController,
    AuthController,
    OrganizationsController,
    ProjectsController,
    ConfigsController,
    EnvironmentsController,
    PublicSdkController,
    SdkKeysController,
    SegmentsController,
    AuditLogsController,
    ApiTokensController,
    ManagementApiController,
  ],
  providers: [
    SessionsService,
    SessionGuard,
    AuthenticatedApiGuard,
    GithubAuthService,
    ApiTokenGuard,
    ApiTokenScopesGuard,
    ApiTokenTenantGuard,
    ApiTokensService,
    ManagementApiRateLimitGuard,
    ManagementApiService,
    OrganizationsService,
    ProjectsService,
    ConfigsService,
    EnvironmentsService,
    PublicSdkService,
    PublicSdkRateLimitGuard,
    SdkKeysService,
    SegmentsService,
    AuditLogsService,
  ],
})
export class AppModule {}
