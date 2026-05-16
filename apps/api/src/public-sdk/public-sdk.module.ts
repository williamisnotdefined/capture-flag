import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CommonModule } from "../common/common.module";
import { ConfigPreviewService } from "./config-preview.service";
import { PublicConfigBuilderService } from "./public-config-builder.service";
import { PublicConfigCacheService } from "./public-config-cache.service";
import { PublicSdkRateLimitGuard } from "./public-sdk-rate-limit.guard";
import { PublicSdkController } from "./public-sdk.controller";
import { PublicSdkService } from "./public-sdk.service";
import { SdkKeyConfigAuthService } from "./sdk-key-config-auth.service";
import { SdkKeyUsageService } from "./sdk-key-usage.service";

@Module({
  imports: [CommonModule, AuthModule],
  controllers: [PublicSdkController],
  providers: [
    PublicSdkService,
    SdkKeyConfigAuthService,
    PublicConfigCacheService,
    PublicConfigBuilderService,
    ConfigPreviewService,
    SdkKeyUsageService,
    PublicSdkRateLimitGuard,
  ],
  exports: [PublicSdkService],
})
export class PublicSdkModule {}
