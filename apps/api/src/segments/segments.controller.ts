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
import { RequireApiTokenScopes } from "../api-tokens/api-token-scopes.decorator";
import { ApiTokenScopesGuard } from "../api-tokens/api-token-scopes.guard";
import { RequireApiTokenTenant } from "../api-tokens/api-token-tenant.decorator";
import { ApiTokenTenantGuard } from "../api-tokens/api-token-tenant.guard";
import { ManagementApiRateLimitGuard } from "../api-tokens/management-api-rate-limit.guard";
import { AuthenticatedApiGuard } from "../auth/authenticated-api.guard";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import { CreateSegmentDto, UpdateSegmentDto } from "../common/dtos";
import { SegmentsService } from "./segments.service";

@Controller("api/v1")
@UseGuards(
  ManagementApiRateLimitGuard,
  AuthenticatedApiGuard,
  ManagementApiRateLimitGuard,
  ApiTokenTenantGuard,
  ApiTokenScopesGuard,
)
export class SegmentsController {
  constructor(private readonly segments: SegmentsService) {}

  @Get("configs/:configId/segments")
  @RequireApiTokenScopes("segments:read")
  @RequireApiTokenTenant({ configParam: "configId" })
  list(@Req() request: AuthenticatedRequest, @Param("configId", ParseUUIDPipe) configId: string) {
    return this.segments.list(request.user.id, configId);
  }

  @Post("configs/:configId/segments")
  @RequireApiTokenScopes("segments:write")
  @RequireApiTokenTenant({ configParam: "configId" })
  create(
    @Req() request: AuthenticatedRequest,
    @Param("configId", ParseUUIDPipe) configId: string,
    @Body() body: CreateSegmentDto,
  ) {
    return this.segments.create(request.user.id, configId, body);
  }

  @Patch("configs/:configId/segments/:segmentId")
  @RequireApiTokenScopes("segments:write")
  @RequireApiTokenTenant({ configParam: "configId", segmentParam: "segmentId" })
  update(
    @Req() request: AuthenticatedRequest,
    @Param("configId", ParseUUIDPipe) configId: string,
    @Param("segmentId", ParseUUIDPipe) segmentId: string,
    @Body() body: UpdateSegmentDto,
  ) {
    return this.segments.update(request.user.id, configId, segmentId, body);
  }

  @Delete("configs/:configId/segments/:segmentId")
  @RequireApiTokenScopes("segments:write")
  @RequireApiTokenTenant({ configParam: "configId", segmentParam: "segmentId" })
  delete(
    @Req() request: AuthenticatedRequest,
    @Param("configId", ParseUUIDPipe) configId: string,
    @Param("segmentId", ParseUUIDPipe) segmentId: string,
  ) {
    return this.segments.delete(request.user.id, configId, segmentId);
  }
}
