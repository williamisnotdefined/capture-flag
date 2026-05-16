import { Body, Delete, Get, Patch, Post } from "@nestjs/common";
import { RequireApiTokenScopes } from "../api-tokens/api-token-scopes.decorator";
import { RequireApiTokenTenant } from "../api-tokens/api-token-tenant.decorator";
import { SessionOrApiTokenController } from "../auth/session-or-api-token-controller.decorator";
import { CurrentUserId } from "../common/current-user-id.decorator";
import { UuidParam } from "../common/uuid-param.decorator";
import {
  CreateProjectDto,
  ProjectMemberDto,
  UpdateProjectDto,
  UpdateProjectMemberDto,
} from "./dto";
import { ProjectsService } from "./projects.service";

@SessionOrApiTokenController("api/v1")
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get("organizations/:organizationId/projects")
  listForOrganization(
    @CurrentUserId() userId: string,
    @UuidParam("organizationId") organizationId: string,
  ) {
    return this.projects.listForOrganization(userId, organizationId);
  }

  @Post("organizations/:organizationId/projects")
  create(
    @CurrentUserId() userId: string,
    @UuidParam("organizationId") organizationId: string,
    @Body() input: CreateProjectDto,
  ) {
    return this.projects.create(userId, organizationId, input);
  }

  @Get("projects/:projectId")
  get(@CurrentUserId() userId: string, @UuidParam("projectId") projectId: string) {
    return this.projects.get(userId, projectId);
  }

  @Patch("projects/:projectId")
  update(
    @CurrentUserId() userId: string,
    @UuidParam("projectId") projectId: string,
    @Body() input: UpdateProjectDto,
  ) {
    return this.projects.update(userId, projectId, input);
  }

  @Delete("projects/:projectId")
  delete(@CurrentUserId() userId: string, @UuidParam("projectId") projectId: string) {
    return this.projects.delete(userId, projectId);
  }

  @Get("projects/:projectId/members")
  @RequireApiTokenScopes("members:read")
  @RequireApiTokenTenant({ projectParam: "projectId" })
  listMembers(@CurrentUserId() userId: string, @UuidParam("projectId") projectId: string) {
    return this.projects.listMembers(userId, projectId);
  }

  @Post("projects/:projectId/members")
  @RequireApiTokenScopes("members:write")
  @RequireApiTokenTenant({ projectParam: "projectId" })
  addMember(
    @CurrentUserId() actorUserId: string,
    @UuidParam("projectId") projectId: string,
    @Body() input: ProjectMemberDto,
  ) {
    return this.projects.addMember(actorUserId, projectId, input);
  }

  @Patch("projects/:projectId/members/:memberId")
  updateMember(
    @CurrentUserId() actorUserId: string,
    @UuidParam("projectId") projectId: string,
    @UuidParam("memberId") memberId: string,
    @Body() input: UpdateProjectMemberDto,
  ) {
    return this.projects.updateMember(actorUserId, projectId, memberId, input);
  }

  @Delete("projects/:projectId/members/:memberId")
  removeMember(
    @CurrentUserId() actorUserId: string,
    @UuidParam("projectId") projectId: string,
    @UuidParam("memberId") memberId: string,
  ) {
    return this.projects.removeMember(actorUserId, projectId, memberId);
  }
}
