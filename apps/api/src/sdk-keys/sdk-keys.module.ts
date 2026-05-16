import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CommonModule } from "../common/common.module";
import { SdkKeysController } from "./sdk-keys.controller";
import { SdkKeysService } from "./sdk-keys.service";

@Module({
  imports: [CommonModule, AuthModule],
  controllers: [SdkKeysController],
  providers: [SdkKeysService],
  exports: [SdkKeysService],
})
export class SdkKeysModule {}
