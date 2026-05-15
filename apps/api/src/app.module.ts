import { Module } from "@nestjs/common";
import { AuditLogsController } from "./audit-logs/audit-logs.controller";
import { AuditLogsService } from "./audit-logs/audit-logs.service";
import { AuthController } from "./auth/auth.controller";
import { GithubAuthService } from "./auth/github-auth.service";
import { SessionGuard } from "./auth/session.guard";
import { SessionsService } from "./auth/sessions.service";
import { AccessService } from "./common/access.service";
import { ConfigsController } from "./configs/configs.controller";
import { ConfigsService } from "./configs/configs.service";
import { EnvironmentsController } from "./environments/environments.controller";
import { EnvironmentsService } from "./environments/environments.service";
import { FeatureFlagsController } from "./feature-flags/feature-flags.controller";
import { FeatureFlagsService } from "./feature-flags/feature-flags.service";
import { HealthController } from "./health/health.controller";
import { OrganizationsController } from "./organizations/organizations.controller";
import { OrganizationsService } from "./organizations/organizations.service";
import { PrismaService } from "./prisma/prisma.service";
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
  controllers: [
    HealthController,
    AuthController,
    OrganizationsController,
    ProjectsController,
    ConfigsController,
    EnvironmentsController,
    FeatureFlagsController,
    PublicSdkController,
    SdkKeysController,
    SegmentsController,
    AuditLogsController,
  ],
  providers: [
    PrismaService,
    SessionsService,
    SessionGuard,
    GithubAuthService,
    AccessService,
    OrganizationsService,
    ProjectsService,
    ConfigsService,
    EnvironmentsService,
    FeatureFlagsService,
    PublicSdkService,
    PublicSdkRateLimitGuard,
    SdkKeysService,
    SegmentsService,
    AuditLogsService,
  ],
})
export class AppModule {}
