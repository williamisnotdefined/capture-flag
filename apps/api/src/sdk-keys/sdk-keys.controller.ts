import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import { SdkKeysService } from "./sdk-keys.service";

@Controller()
@UseGuards(SessionGuard)
export class SdkKeysController {
  constructor(private readonly sdkKeys: SdkKeysService) {}

  @Get("projects/:projectId/sdk-keys")
  list(@Req() request: AuthenticatedRequest, @Param("projectId") projectId: string) {
    return this.sdkKeys.list(request.user.id, projectId);
  }

  @Post("projects/:projectId/sdk-keys")
  create(
    @Req() request: AuthenticatedRequest,
    @Param("projectId") projectId: string,
    @Body() body: { configId?: string; environmentId?: string; name?: string },
  ) {
    return this.sdkKeys.create(request.user.id, projectId, body);
  }

  @Post("sdk-keys/:sdkKeyId/revoke")
  revoke(@Req() request: AuthenticatedRequest, @Param("sdkKeyId") sdkKeyId: string) {
    return this.sdkKeys.revoke(request.user.id, sdkKeyId);
  }
}
