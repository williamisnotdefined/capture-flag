import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { RequireApiTokenScopes } from "../api-tokens/api-token-scopes.decorator";
import { ApiTokenScopesGuard } from "../api-tokens/api-token-scopes.guard";
import { RequireApiTokenTenant } from "../api-tokens/api-token-tenant.decorator";
import { ApiTokenTenantGuard } from "../api-tokens/api-token-tenant.guard";
import { ApiTokenGuard } from "../api-tokens/api-token.guard";
import { ManagementApiRateLimitGuard } from "../api-tokens/management-api-rate-limit.guard";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import {
  CreateManagementFeatureFlagDto,
  CreateProjectDto,
  ListManagementEnvironmentsQueryDto,
  ListManagementFlagsQueryDto,
  UpdateFeatureFlagDto,
} from "../common/dtos";
import { ManagementApiService } from "./management-api.service";

@Controller("api/v1")
@UseGuards(
  ManagementApiRateLimitGuard,
  ApiTokenGuard,
  ManagementApiRateLimitGuard,
  ApiTokenTenantGuard,
  ApiTokenScopesGuard,
)
export class ManagementApiController {
  constructor(private readonly managementApi: ManagementApiService) {}

  @Get("projects")
  @RequireApiTokenScopes("projects:read")
  listProjects(@Req() request: AuthenticatedRequest) {
    return this.managementApi.listProjects(request.user.id, requireApiToken(request));
  }

  @Post("projects")
  @RequireApiTokenScopes("projects:write")
  createProject(@Req() request: AuthenticatedRequest, @Body() body: CreateProjectDto) {
    return this.managementApi.createProject(request.user.id, requireApiToken(request), body);
  }

  @Get("flags")
  @RequireApiTokenScopes("flags:read")
  @RequireApiTokenTenant({ configQuery: "configId" })
  listFlags(@Req() request: AuthenticatedRequest, @Query() query: ListManagementFlagsQueryDto) {
    return this.managementApi.listFlags(request.user.id, query.configId);
  }

  @Post("flags")
  @RequireApiTokenScopes("flags:write")
  @RequireApiTokenTenant({ configBody: "configId" })
  createFlag(@Req() request: AuthenticatedRequest, @Body() body: CreateManagementFeatureFlagDto) {
    return this.managementApi.createFlag(request.user.id, body);
  }

  @Patch("flags/:id")
  @RequireApiTokenScopes("flags:write")
  @RequireApiTokenTenant({ featureFlagParam: "id" })
  updateFlag(
    @Req() request: AuthenticatedRequest,
    @Param("id", ParseUUIDPipe) featureFlagId: string,
    @Body() body: UpdateFeatureFlagDto,
  ) {
    return this.managementApi.updateFlag(request.user.id, featureFlagId, body);
  }

  @Get("environments")
  @RequireApiTokenScopes("environments:read")
  @RequireApiTokenTenant({ projectQuery: "projectId" })
  listEnvironments(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListManagementEnvironmentsQueryDto,
  ) {
    return this.managementApi.listEnvironments(request.user.id, query.projectId);
  }
}

function requireApiToken(request: AuthenticatedRequest) {
  if (!request.apiToken) {
    throw new UnauthorizedException("Missing API token");
  }

  return request.apiToken;
}
