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
  CreateProjectDto,
  ProjectMemberDto,
  UpdateProjectDto,
  UpdateProjectMemberDto,
} from "../common/dtos";
import { ProjectsService } from "./projects.service";

@Controller("api/v1")
@UseGuards(
  ManagementApiRateLimitGuard,
  AuthenticatedApiGuard,
  ManagementApiRateLimitGuard,
  ApiTokenTenantGuard,
  ApiTokenScopesGuard,
)
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get("organizations/:organizationId/projects")
  listForOrganization(
    @Req() request: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
  ) {
    return this.projects.listForOrganization(request.user.id, organizationId);
  }

  @Post("organizations/:organizationId/projects")
  create(
    @Req() request: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Body() body: CreateProjectDto,
  ) {
    return this.projects.create(request.user.id, organizationId, body);
  }

  @Get("projects/:projectId")
  get(@Req() request: AuthenticatedRequest, @Param("projectId", ParseUUIDPipe) projectId: string) {
    return this.projects.get(request.user.id, projectId);
  }

  @Patch("projects/:projectId")
  update(
    @Req() request: AuthenticatedRequest,
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @Body() body: UpdateProjectDto,
  ) {
    return this.projects.update(request.user.id, projectId, body);
  }

  @Delete("projects/:projectId")
  delete(
    @Req() request: AuthenticatedRequest,
    @Param("projectId", ParseUUIDPipe) projectId: string,
  ) {
    return this.projects.delete(request.user.id, projectId);
  }

  @Get("projects/:projectId/members")
  @RequireApiTokenScopes("members:read")
  @RequireApiTokenTenant({ projectParam: "projectId" })
  listMembers(
    @Req() request: AuthenticatedRequest,
    @Param("projectId", ParseUUIDPipe) projectId: string,
  ) {
    return this.projects.listMembers(request.user.id, projectId);
  }

  @Post("projects/:projectId/members")
  @RequireApiTokenScopes("members:write")
  @RequireApiTokenTenant({ projectParam: "projectId" })
  addMember(
    @Req() request: AuthenticatedRequest,
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @Body() body: ProjectMemberDto,
  ) {
    return this.projects.addMember(request.user.id, projectId, body);
  }

  @Patch("projects/:projectId/members/:memberId")
  updateMember(
    @Req() request: AuthenticatedRequest,
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @Param("memberId", ParseUUIDPipe) memberId: string,
    @Body() body: UpdateProjectMemberDto,
  ) {
    return this.projects.updateMember(request.user.id, projectId, memberId, body);
  }

  @Delete("projects/:projectId/members/:memberId")
  removeMember(
    @Req() request: AuthenticatedRequest,
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @Param("memberId", ParseUUIDPipe) memberId: string,
  ) {
    return this.projects.removeMember(request.user.id, projectId, memberId);
  }
}
