import { Module } from "@nestjs/common";
import { ApiTokensModule } from "../api-tokens/api-tokens.module";
import { CommonModule } from "../common/common.module";
import { ConfigsController } from "./configs.controller";
import { ConfigsService } from "./configs.service";

@Module({
  imports: [CommonModule, ApiTokensModule],
  controllers: [ConfigsController],
  providers: [ConfigsService],
  exports: [ConfigsService],
})
export class ConfigsModule {}
