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
import { CreateEnvironmentDto, UpdateEnvironmentDto } from "../common/dtos";
import { EnvironmentsService } from "./environments.service";

@Controller("api/v1")
@UseGuards(
  AuthenticatedApiGuard,
  ManagementApiRateLimitGuard,
  ApiTokenTenantGuard,
  ApiTokenScopesGuard,
)
export class EnvironmentsController {
  constructor(private readonly environments: EnvironmentsService) {}

  @Get("projects/:projectId/environments")
  @RequireApiTokenScopes("environments:read")
  @RequireApiTokenTenant({ projectParam: "projectId" })
  list(@Req() request: AuthenticatedRequest, @Param("projectId", ParseUUIDPipe) projectId: string) {
    return this.environments.list(request.user.id, projectId);
  }

  @Post("projects/:projectId/environments")
  create(
    @Req() request: AuthenticatedRequest,
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @Body() body: CreateEnvironmentDto,
  ) {
    return this.environments.create(request.user.id, projectId, body);
  }

  @Patch("environments/:environmentId")
  update(
    @Req() request: AuthenticatedRequest,
    @Param("environmentId", ParseUUIDPipe) environmentId: string,
    @Body() body: UpdateEnvironmentDto,
  ) {
    return this.environments.update(request.user.id, environmentId, body);
  }

  @Delete("environments/:environmentId")
  delete(
    @Req() request: AuthenticatedRequest,
    @Param("environmentId", ParseUUIDPipe) environmentId: string,
  ) {
    return this.environments.delete(request.user.id, environmentId);
  }
}
