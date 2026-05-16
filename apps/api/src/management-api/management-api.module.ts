import { Module } from "@nestjs/common";
import { ApiTokensModule } from "../api-tokens/api-tokens.module";
import { CommonModule } from "../common/common.module";
import { EnvironmentsModule } from "../environments/environments.module";
import { FeatureFlagsModule } from "../feature-flags/feature-flags.module";
import { ProjectsModule } from "../projects/projects.module";
import { ManagementApiController } from "./management-api.controller";
import { ManagementApiService } from "./management-api.service";

@Module({
  imports: [CommonModule, ApiTokensModule, ProjectsModule, FeatureFlagsModule, EnvironmentsModule],
  controllers: [ManagementApiController],
  providers: [ManagementApiService],
})
export class ManagementApiModule {}
