import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CommonModule } from "../common/common.module";
import { SdkKeysController } from "./sdk-keys.controller";
import { SdkKeysService } from "./sdk-keys.service";
import { SdkKeyAccessService, SdkKeyAuditService, SdkKeyCredentialService } from "./support";
import {
  BulkRevokeSdkKeysService,
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
    SdkKeyCredentialService,
    ListSdkKeysService,
    CreateSdkKeyService,
    RevokeSdkKeyService,
    RotateSdkKeyService,
    BulkRevokeSdkKeysService,
  ],
  exports: [SdkKeysService],
})
export class SdkKeysModule {}
