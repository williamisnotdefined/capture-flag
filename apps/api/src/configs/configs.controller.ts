import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
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
import { CreateConfigDto } from "../common/dtos";
import { ConfigsService } from "./configs.service";

@Controller("api/v1")
@UseGuards(
  ManagementApiRateLimitGuard,
  AuthenticatedApiGuard,
  ManagementApiRateLimitGuard,
  ApiTokenTenantGuard,
  ApiTokenScopesGuard,
)
export class ConfigsController {
  constructor(private readonly configs: ConfigsService) {}

  @Get("projects/:projectId/configs")
  @RequireApiTokenScopes("configs:read")
  @RequireApiTokenTenant({ projectParam: "projectId" })
  list(@Req() request: AuthenticatedRequest, @Param("projectId", ParseUUIDPipe) projectId: string) {
    return this.configs.list(request.user.id, projectId);
  }

  @Post("projects/:projectId/configs")
  @RequireApiTokenScopes("configs:write")
  @RequireApiTokenTenant({ projectParam: "projectId" })
  create(
    @Req() request: AuthenticatedRequest,
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @Body() body: CreateConfigDto,
  ) {
    return this.configs.create(request.user.id, projectId, body);
  }

  @Delete("configs/:configId")
  delete(@Req() request: AuthenticatedRequest, @Param("configId", ParseUUIDPipe) configId: string) {
    return this.configs.delete(request.user.id, configId);
  }
}
