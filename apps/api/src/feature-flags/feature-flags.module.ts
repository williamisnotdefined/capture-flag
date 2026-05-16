import { Module } from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import { SessionsService } from "../auth/sessions.service";
import { CommonModule } from "../common/common.module";
import { FeatureFlagsController } from "./feature-flags.controller";
import { FeatureFlagsService } from "./feature-flags.service";
import { FeatureFlagSupportService } from "./support/feature-flag-support.service";
import {
  CreateFeatureFlagService,
  DeleteFeatureFlagService,
  ListFeatureFlagActivityService,
  ListFeatureFlagsService,
  UpdateFeatureFlagEnvironmentValueService,
  UpdateFeatureFlagService,
} from "./use-cases";

@Module({
  imports: [CommonModule],
  controllers: [FeatureFlagsController],
  providers: [
    SessionsService,
    SessionGuard,
    FeatureFlagsService,
    FeatureFlagSupportService,
    ListFeatureFlagsService,
    CreateFeatureFlagService,
    UpdateFeatureFlagService,
    DeleteFeatureFlagService,
    ListFeatureFlagActivityService,
    UpdateFeatureFlagEnvironmentValueService,
  ],
  exports: [FeatureFlagsService],
})
export class FeatureFlagsModule {}
