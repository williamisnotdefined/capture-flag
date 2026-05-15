import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import {
  CreateFeatureFlagDto,
  ListFeatureFlagActivityQueryDto,
  UpdateFeatureFlagDto,
  UpdateFeatureFlagEnvironmentValueDto,
} from "../common/dtos";
import { FeatureFlagsService } from "./feature-flags.service";

@Controller("api/v1")
@UseGuards(SessionGuard)
export class FeatureFlagsController {
  constructor(private readonly featureFlags: FeatureFlagsService) {}

  @Get("configs/:configId/feature-flags")
  list(@Req() request: AuthenticatedRequest, @Param("configId", ParseUUIDPipe) configId: string) {
    return this.featureFlags.list(request.user.id, configId);
  }

  @Post("configs/:configId/feature-flags")
  create(
    @Req() request: AuthenticatedRequest,
    @Param("configId", ParseUUIDPipe) configId: string,
    @Body() body: CreateFeatureFlagDto,
  ) {
    return this.featureFlags.create(request.user.id, configId, body);
  }

  @Patch("configs/:configId/feature-flags/:featureFlagId")
  update(
    @Req() request: AuthenticatedRequest,
    @Param("configId", ParseUUIDPipe) configId: string,
    @Param("featureFlagId", ParseUUIDPipe) featureFlagId: string,
    @Body() body: UpdateFeatureFlagDto,
  ) {
    return this.featureFlags.update(request.user.id, configId, featureFlagId, body);
  }

  @Delete("configs/:configId/feature-flags/:featureFlagId")
  delete(
    @Req() request: AuthenticatedRequest,
    @Param("configId", ParseUUIDPipe) configId: string,
    @Param("featureFlagId", ParseUUIDPipe) featureFlagId: string,
  ) {
    return this.featureFlags.delete(request.user.id, configId, featureFlagId);
  }

  @Get("configs/:configId/feature-flags/:featureFlagId/activity")
  listActivity(
    @Req() request: AuthenticatedRequest,
    @Param("configId", ParseUUIDPipe) configId: string,
    @Param("featureFlagId", ParseUUIDPipe) featureFlagId: string,
    @Query() query: ListFeatureFlagActivityQueryDto,
  ) {
    return this.featureFlags.listActivity(request.user.id, configId, featureFlagId, query);
  }

  @Patch("configs/:configId/feature-flags/:featureFlagId/environments/:environmentId/value")
  updateEnvironmentValue(
    @Req() request: AuthenticatedRequest,
    @Param("configId", ParseUUIDPipe) configId: string,
    @Param("featureFlagId", ParseUUIDPipe) featureFlagId: string,
    @Param("environmentId", ParseUUIDPipe) environmentId: string,
    @Body() body: UpdateFeatureFlagEnvironmentValueDto,
  ) {
    return this.featureFlags.updateEnvironmentValue(
      request.user.id,
      configId,
      featureFlagId,
      environmentId,
      body,
    );
  }
}
