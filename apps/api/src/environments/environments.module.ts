import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CommonModule } from "../common/common.module";
import { EnvironmentsController } from "./environments.controller";
import { EnvironmentsService } from "./environments.service";
import {
  EnvironmentAccessService,
  EnvironmentConfigStateService,
  EnvironmentFeatureFlagValuesService,
} from "./support";
import {
  BulkDeleteEnvironmentsService,
  CreateEnvironmentService,
  DeleteEnvironmentService,
  ListEnvironmentsService,
  UpdateEnvironmentService,
} from "./use-cases";

@Module({
  imports: [CommonModule, AuthModule],
  controllers: [EnvironmentsController],
  providers: [
    EnvironmentsService,
    EnvironmentAccessService,
    EnvironmentConfigStateService,
    EnvironmentFeatureFlagValuesService,
    ListEnvironmentsService,
    CreateEnvironmentService,
    UpdateEnvironmentService,
    DeleteEnvironmentService,
    BulkDeleteEnvironmentsService,
  ],
  exports: [EnvironmentsService],
})
export class EnvironmentsModule {}
