import { Module } from "@nestjs/common";
import { ApiTokensModule } from "../api-tokens/api-tokens.module";
import { CommonModule } from "../common/common.module";
import { ConfigsController } from "./configs.controller";
import { ConfigsService } from "./configs.service";
import { ConfigAccessService, ConfigAuditService, ConfigEnvironmentStateService } from "./support";
import {
  BulkDeleteConfigsService,
  CreateConfigService,
  DeleteConfigService,
  ListConfigsService,
  UpdateConfigService,
} from "./use-cases";

@Module({
  imports: [CommonModule, ApiTokensModule],
  controllers: [ConfigsController],
  providers: [
    ConfigsService,
    ConfigAccessService,
    ConfigAuditService,
    ConfigEnvironmentStateService,
    ListConfigsService,
    CreateConfigService,
    UpdateConfigService,
    DeleteConfigService,
    BulkDeleteConfigsService,
  ],
  exports: [ConfigsService],
})
export class ConfigsModule {}
