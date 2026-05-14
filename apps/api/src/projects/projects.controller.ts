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
import { SessionGuard } from "../auth/session.guard";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import {
  CreateProjectDto,
  ProjectMemberDto,
  UpdateProjectDto,
  UpdateProjectMemberDto,
} from "../common/dtos";
import { ProjectsService } from "./projects.service";

@Controller()
@UseGuards(SessionGuard)
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
  listMembers(
    @Req() request: AuthenticatedRequest,
    @Param("projectId", ParseUUIDPipe) projectId: string,
  ) {
    return this.projects.listMembers(request.user.id, projectId);
  }

  @Post("projects/:projectId/members")
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
