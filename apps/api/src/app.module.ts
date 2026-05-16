import { Module } from "@nestjs/common";
import { ApiTokensModule } from "./api-tokens/api-tokens.module";
import { AuditLogsModule } from "./audit-logs/audit-logs.module";
import { AuthModule } from "./auth/auth.module";
import { ConfigsModule } from "./configs/configs.module";
import { EnvironmentsModule } from "./environments/environments.module";
import { FeatureFlagsModule } from "./feature-flags/feature-flags.module";
import { HealthModule } from "./health/health.module";
import { ManagementApiModule } from "./management-api/management-api.module";
import { OrganizationsModule } from "./organizations/organizations.module";
import { ProjectsModule } from "./projects/projects.module";
import { PublicSdkModule } from "./public-sdk/public-sdk.module";
import { SdkKeysModule } from "./sdk-keys/sdk-keys.module";
import { SegmentsModule } from "./segments/segments.module";

@Module({
  imports: [
    AuthModule,
    ApiTokensModule,
    HealthModule,
    OrganizationsModule,
    ProjectsModule,
    ConfigsModule,
    EnvironmentsModule,
    FeatureFlagsModule,
    SegmentsModule,
    SdkKeysModule,
    AuditLogsModule,
    PublicSdkModule,
    ManagementApiModule,
  ],
})
export class AppModule {}
