import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CommonModule } from "../common/common.module";
import { FeatureFlagsController } from "./feature-flags.controller";
import { FeatureFlagsService } from "./feature-flags.service";
import {
  FeatureFlagAccessService,
  FeatureFlagAuditService,
  FeatureFlagConfigStateService,
  FeatureFlagCreateInputService,
  FeatureFlagEnvironmentValueAuditService,
  FeatureFlagEnvironmentValueInitializerService,
  FeatureFlagEnvironmentValueInputService,
  FeatureFlagEnvironmentValueWriterService,
  FeatureFlagPrerequisiteGraphService,
  FeatureFlagPublicValueService,
  FeatureFlagReferenceService,
  FeatureFlagRuleContextService,
  FeatureFlagRulesService,
  FeatureFlagUpdateInputService,
} from "./support";
import {
  CreateFeatureFlagService,
  DeleteFeatureFlagService,
  ListFeatureFlagActivityService,
  ListFeatureFlagsService,
  UpdateFeatureFlagEnvironmentValueService,
  UpdateFeatureFlagService,
} from "./use-cases";

@Module({
  imports: [CommonModule, AuthModule],
  controllers: [FeatureFlagsController],
  providers: [
    FeatureFlagsService,
    FeatureFlagAccessService,
    FeatureFlagAuditService,
    FeatureFlagConfigStateService,
    FeatureFlagCreateInputService,
    FeatureFlagEnvironmentValueAuditService,
    FeatureFlagEnvironmentValueInitializerService,
    FeatureFlagEnvironmentValueInputService,
    FeatureFlagEnvironmentValueWriterService,
    FeatureFlagPrerequisiteGraphService,
    FeatureFlagPublicValueService,
    FeatureFlagReferenceService,
    FeatureFlagRuleContextService,
    FeatureFlagRulesService,
    FeatureFlagUpdateInputService,
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
