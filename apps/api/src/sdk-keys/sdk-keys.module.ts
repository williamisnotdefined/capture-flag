import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CommonModule } from "../common/common.module";
import { SdkKeysController } from "./sdk-keys.controller";
import { SdkKeysService } from "./sdk-keys.service";
import { SdkKeyAccessService, SdkKeyAuditService } from "./support";
import {
  CreateSdkKeyService,
  ListSdkKeysService,
  RevokeSdkKeyService,
  RotateSdkKeyService,
} from "./use-cases";

@Module({
  imports: [CommonModule, AuthModule],
  controllers: [SdkKeysController],
  providers: [
    SdkKeysService,
    SdkKeyAccessService,
    SdkKeyAuditService,
    ListSdkKeysService,
    CreateSdkKeyService,
    RevokeSdkKeyService,
    RotateSdkKeyService,
  ],
  exports: [SdkKeysService],
})
export class SdkKeysModule {}
