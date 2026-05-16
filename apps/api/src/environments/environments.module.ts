import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CommonModule } from "../common/common.module";
import { EnvironmentsController } from "./environments.controller";
import { EnvironmentsService } from "./environments.service";

@Module({
  imports: [CommonModule, AuthModule],
  controllers: [EnvironmentsController],
  providers: [EnvironmentsService],
  exports: [EnvironmentsService],
})
export class EnvironmentsModule {}
