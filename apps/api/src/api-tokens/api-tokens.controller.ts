import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import { CreateApiTokenDto } from "../common/dtos";
import { ApiTokensService } from "./api-tokens.service";

@Controller("api/v1")
@UseGuards(SessionGuard)
export class ApiTokensController {
  constructor(private readonly apiTokens: ApiTokensService) {}

  @Get("organizations/:organizationId/api-tokens")
  list(
    @Req() request: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
  ) {
    return this.apiTokens.list(request.user.id, organizationId);
  }

  @Post("organizations/:organizationId/api-tokens")
  create(
    @Req() request: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Body() body: CreateApiTokenDto,
  ) {
    return this.apiTokens.create(request.user.id, organizationId, body);
  }

  @Post("api-tokens/:apiTokenId/revoke")
  revoke(
    @Req() request: AuthenticatedRequest,
    @Param("apiTokenId", ParseUUIDPipe) apiTokenId: string,
  ) {
    return this.apiTokens.revoke(request.user.id, apiTokenId);
  }
}
