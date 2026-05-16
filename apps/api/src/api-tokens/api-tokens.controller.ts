import { Body, Get, Post } from "@nestjs/common";
import { SessionApiController } from "../auth/session-api-controller.decorator";
import { CurrentUserId } from "../common/current-user-id.decorator";
import { UuidParam } from "../common/uuid-param.decorator";
import { ApiTokensService } from "./api-tokens.service";
import { CreateApiTokenDto } from "./dto";

@SessionApiController("api/v1")
export class ApiTokensController {
  constructor(private readonly apiTokens: ApiTokensService) {}

  @Get("organizations/:organizationId/api-tokens")
  list(@CurrentUserId() userId: string, @UuidParam("organizationId") organizationId: string) {
    return this.apiTokens.list(userId, organizationId);
  }

  @Post("organizations/:organizationId/api-tokens")
  create(
    @CurrentUserId() userId: string,
    @UuidParam("organizationId") organizationId: string,
    @Body() body: CreateApiTokenDto,
  ) {
    return this.apiTokens.create(userId, organizationId, body);
  }

  @Post("api-tokens/:apiTokenId/revoke")
  revoke(@CurrentUserId() userId: string, @UuidParam("apiTokenId") apiTokenId: string) {
    return this.apiTokens.revoke(userId, apiTokenId);
  }
}
