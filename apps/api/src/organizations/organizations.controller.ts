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
import {
  CreateOrganizationDto,
  OrganizationMemberDto,
  UpdateOrganizationMemberDto,
} from "../common/dtos";
import { OrganizationsService } from "./organizations.service";

@Controller("api/v1/organizations")
@UseGuards(
  AuthenticatedApiGuard,
  ManagementApiRateLimitGuard,
  ApiTokenTenantGuard,
  ApiTokenScopesGuard,
)
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.organizations.listForUser(request.user.id);
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() body: CreateOrganizationDto) {
    return this.organizations.create(request.user.id, body);
  }

  @Get(":organizationId")
  get(
    @Req() request: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
  ) {
    return this.organizations.get(request.user.id, organizationId);
  }

  @Get(":organizationId/members")
  @RequireApiTokenScopes("members:read")
  @RequireApiTokenTenant({ organizationParam: "organizationId" })
  listMembers(
    @Req() request: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
  ) {
    return this.organizations.listMembers(request.user.id, organizationId);
  }

  @Post(":organizationId/members")
  @RequireApiTokenScopes("members:write")
  @RequireApiTokenTenant({ organizationParam: "organizationId" })
  addMember(
    @Req() request: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Body() body: OrganizationMemberDto,
  ) {
    return this.organizations.addMember(request.user.id, organizationId, body);
  }

  @Patch(":organizationId/members/:memberId")
  @RequireApiTokenScopes("members:write")
  @RequireApiTokenTenant({ organizationParam: "organizationId" })
  updateMember(
    @Req() request: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Param("memberId", ParseUUIDPipe) memberId: string,
    @Body() body: UpdateOrganizationMemberDto,
  ) {
    return this.organizations.updateMember(request.user.id, organizationId, memberId, body);
  }

  @Delete(":organizationId/members/:memberId")
  @RequireApiTokenScopes("members:write")
  @RequireApiTokenTenant({ organizationParam: "organizationId" })
  removeMember(
    @Req() request: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Param("memberId", ParseUUIDPipe) memberId: string,
  ) {
    return this.organizations.removeMember(request.user.id, organizationId, memberId);
  }
}
