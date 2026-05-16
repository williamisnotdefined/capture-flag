import { Body, Delete, Get, Patch, Post, Query } from "@nestjs/common";
import { SessionApiController } from "../auth/session-api-controller.decorator";
import { CurrentUserId } from "../common/current-user-id.decorator";
import {
  CreateFeatureFlagDto,
  ListFeatureFlagActivityQueryDto,
  UpdateFeatureFlagDto,
  UpdateFeatureFlagEnvironmentValueDto,
} from "../common/dtos";
import { UuidParam } from "../common/uuid-param.decorator";
import {
  CreateFeatureFlagService,
  DeleteFeatureFlagService,
  ListFeatureFlagActivityService,
  ListFeatureFlagsService,
  UpdateFeatureFlagEnvironmentValueService,
  UpdateFeatureFlagService,
} from "./use-cases";

@SessionApiController("api/v1")
export class FeatureFlagsController {
  constructor(
    private readonly listFeatureFlags: ListFeatureFlagsService,
    private readonly createFeatureFlag: CreateFeatureFlagService,
    private readonly updateFeatureFlag: UpdateFeatureFlagService,
    private readonly deleteFeatureFlag: DeleteFeatureFlagService,
    private readonly listFeatureFlagActivity: ListFeatureFlagActivityService,
    private readonly updateFeatureFlagEnvironmentValue: UpdateFeatureFlagEnvironmentValueService,
  ) {}

  @Get("configs/:configId/feature-flags")
  list(@CurrentUserId() userId: string, @UuidParam("configId") configId: string) {
    return this.listFeatureFlags.execute({ userId, configId });
  }

  @Post("configs/:configId/feature-flags")
  create(
    @CurrentUserId() userId: string,
    @UuidParam("configId") configId: string,
    @Body() input: CreateFeatureFlagDto,
  ) {
    return this.createFeatureFlag.execute({ userId, configId, input });
  }

  @Patch("configs/:configId/feature-flags/:featureFlagId")
  update(
    @CurrentUserId() userId: string,
    @UuidParam("configId") configId: string,
    @UuidParam("featureFlagId") featureFlagId: string,
    @Body() input: UpdateFeatureFlagDto,
  ) {
    return this.updateFeatureFlag.execute({ userId, configId, featureFlagId, input });
  }

  @Delete("configs/:configId/feature-flags/:featureFlagId")
  delete(
    @CurrentUserId() userId: string,
    @UuidParam("configId") configId: string,
    @UuidParam("featureFlagId") featureFlagId: string,
  ) {
    return this.deleteFeatureFlag.execute({ userId, configId, featureFlagId });
  }

  @Get("configs/:configId/feature-flags/:featureFlagId/activity")
  listActivity(
    @CurrentUserId() userId: string,
    @UuidParam("configId") configId: string,
    @UuidParam("featureFlagId") featureFlagId: string,
    @Query() query: ListFeatureFlagActivityQueryDto,
  ) {
    return this.listFeatureFlagActivity.execute({ userId, configId, featureFlagId, query });
  }

  @Patch("configs/:configId/feature-flags/:featureFlagId/environments/:environmentId/value")
  updateEnvironmentValue(
    @CurrentUserId() userId: string,
    @UuidParam("configId") configId: string,
    @UuidParam("featureFlagId") featureFlagId: string,
    @UuidParam("environmentId") environmentId: string,
    @Body() input: UpdateFeatureFlagEnvironmentValueDto,
  ) {
    return this.updateFeatureFlagEnvironmentValue.execute({
      userId,
      configId,
      featureFlagId,
      environmentId,
      input,
    });
  }
}
