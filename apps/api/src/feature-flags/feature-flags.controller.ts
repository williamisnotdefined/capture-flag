import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import {
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
  UpdateFeatureFlagEnvironmentValueDto,
} from "../common/dtos";
import { FeatureFlagsService } from "./feature-flags.service";

@Controller()
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

  @Patch("feature-flags/:featureFlagId")
  update(
    @Req() request: AuthenticatedRequest,
    @Param("featureFlagId", ParseUUIDPipe) featureFlagId: string,
    @Body() body: UpdateFeatureFlagDto,
  ) {
    return this.featureFlags.update(request.user.id, featureFlagId, body);
  }

  @Delete("feature-flags/:featureFlagId")
  delete(
    @Req() request: AuthenticatedRequest,
    @Param("featureFlagId", ParseUUIDPipe) featureFlagId: string,
  ) {
    return this.featureFlags.delete(request.user.id, featureFlagId);
  }

  @Patch("feature-flags/:featureFlagId/environments/:environmentId/value")
  updateEnvironmentValue(
    @Req() request: AuthenticatedRequest,
    @Param("featureFlagId", ParseUUIDPipe) featureFlagId: string,
    @Param("environmentId", ParseUUIDPipe) environmentId: string,
    @Body() body: UpdateFeatureFlagEnvironmentValueDto,
  ) {
    return this.featureFlags.updateEnvironmentValue(
      request.user.id,
      featureFlagId,
      environmentId,
      body,
    );
  }
}
