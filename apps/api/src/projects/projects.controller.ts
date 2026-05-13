import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import { ProjectsService } from "./projects.service";

@Controller()
@UseGuards(SessionGuard)
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get("organizations/:organizationId/projects")
  listForOrganization(
    @Req() request: AuthenticatedRequest,
    @Param("organizationId") organizationId: string,
  ) {
    return this.projects.listForOrganization(request.user.id, organizationId);
  }

  @Post("organizations/:organizationId/projects")
  create(
    @Req() request: AuthenticatedRequest,
    @Param("organizationId") organizationId: string,
    @Body() body: { name?: string; slug?: string },
  ) {
    return this.projects.create(request.user.id, organizationId, body);
  }

  @Get("projects/:projectId")
  get(@Req() request: AuthenticatedRequest, @Param("projectId") projectId: string) {
    return this.projects.get(request.user.id, projectId);
  }

  @Patch("projects/:projectId")
  update(
    @Req() request: AuthenticatedRequest,
    @Param("projectId") projectId: string,
    @Body() body: { name?: string; slug?: string },
  ) {
    return this.projects.update(request.user.id, projectId, body);
  }

  @Delete("projects/:projectId")
  delete(@Req() request: AuthenticatedRequest, @Param("projectId") projectId: string) {
    return this.projects.delete(request.user.id, projectId);
  }

  @Get("projects/:projectId/members")
  listMembers(@Req() request: AuthenticatedRequest, @Param("projectId") projectId: string) {
    return this.projects.listMembers(request.user.id, projectId);
  }

  @Post("projects/:projectId/members")
  addMember(
    @Req() request: AuthenticatedRequest,
    @Param("projectId") projectId: string,
    @Body() body: { userId?: string; email?: string; role?: string },
  ) {
    return this.projects.addMember(request.user.id, projectId, body);
  }
}
