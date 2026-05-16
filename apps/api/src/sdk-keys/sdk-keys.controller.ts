import { Body, Get, Post } from "@nestjs/common";
import { SessionApiController } from "../auth/session-api-controller.decorator";
import { CurrentUserId } from "../common/current-user-id.decorator";
import { UuidParam } from "../common/uuid-param.decorator";
import { CreateSdkKeyDto } from "./dto";
import { SdkKeysService } from "./sdk-keys.service";

@SessionApiController("api/v1")
export class SdkKeysController {
  constructor(private readonly sdkKeys: SdkKeysService) {}

  @Get("projects/:projectId/sdk-keys")
  list(@CurrentUserId() userId: string, @UuidParam("projectId") projectId: string) {
    return this.sdkKeys.list(userId, projectId);
  }

  @Post("projects/:projectId/sdk-keys")
  create(
    @CurrentUserId() userId: string,
    @UuidParam("projectId") projectId: string,
    @Body() body: CreateSdkKeyDto,
  ) {
    return this.sdkKeys.create(userId, projectId, body);
  }

  @Post("sdk-keys/:sdkKeyId/revoke")
  revoke(@CurrentUserId() userId: string, @UuidParam("sdkKeyId") sdkKeyId: string) {
    return this.sdkKeys.revoke(userId, sdkKeyId);
  }

  @Post("sdk-keys/:sdkKeyId/rotate")
  rotate(@CurrentUserId() userId: string, @UuidParam("sdkKeyId") sdkKeyId: string) {
    return this.sdkKeys.rotate(userId, sdkKeyId);
  }
}
