import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import { CreateSdkKeyDto } from "../common/dtos";
import { SdkKeysService } from "./sdk-keys.service";

@Controller()
@UseGuards(SessionGuard)
export class SdkKeysController {
  constructor(private readonly sdkKeys: SdkKeysService) {}

  @Get("projects/:projectId/sdk-keys")
  list(@Req() request: AuthenticatedRequest, @Param("projectId", ParseUUIDPipe) projectId: string) {
    return this.sdkKeys.list(request.user.id, projectId);
  }

  @Post("projects/:projectId/sdk-keys")
  create(
    @Req() request: AuthenticatedRequest,
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @Body() body: CreateSdkKeyDto,
  ) {
    return this.sdkKeys.create(request.user.id, projectId, body);
  }

  @Post("sdk-keys/:sdkKeyId/revoke")
  revoke(@Req() request: AuthenticatedRequest, @Param("sdkKeyId", ParseUUIDPipe) sdkKeyId: string) {
    return this.sdkKeys.revoke(request.user.id, sdkKeyId);
  }

  @Post("sdk-keys/:sdkKeyId/rotate")
  rotate(@Req() request: AuthenticatedRequest, @Param("sdkKeyId", ParseUUIDPipe) sdkKeyId: string) {
    return this.sdkKeys.rotate(request.user.id, sdkKeyId);
  }
}
