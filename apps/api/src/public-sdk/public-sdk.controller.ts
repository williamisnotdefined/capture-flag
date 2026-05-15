import {
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { SessionGuard } from "../auth/session.guard";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import { PublicSdkRateLimitGuard } from "./public-sdk-rate-limit.guard";
import { PublicSdkService } from "./public-sdk.service";

@Controller()
export class PublicSdkController {
  constructor(private readonly publicSdk: PublicSdkService) {}

  @Get("public-api/v1/sdk/:sdkKey/config")
  @UseGuards(PublicSdkRateLimitGuard)
  async getConfig(
    @Param("sdkKey") sdkKey: string,
    @Headers("if-none-match") ifNoneMatch: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.publicSdk.getConfig(sdkKey, ifNoneMatch);

    response.setHeader("ETag", result.etag);
    response.setHeader("Cache-Control", result.cacheControl);

    if (result.notModified) {
      response.status(304);
      return undefined;
    }

    return result.body;
  }

  @Get("api/v1/configs/:configId/environments/:environmentId/config-preview")
  @UseGuards(SessionGuard)
  previewConfig(
    @Req() request: AuthenticatedRequest,
    @Param("configId", ParseUUIDPipe) configId: string,
    @Param("environmentId", ParseUUIDPipe) environmentId: string,
  ) {
    return this.publicSdk.previewConfig(request.user.id, configId, environmentId);
  }
}
