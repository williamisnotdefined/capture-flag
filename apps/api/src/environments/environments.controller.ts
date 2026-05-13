import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import { EnvironmentsService } from "./environments.service";

@Controller()
@UseGuards(SessionGuard)
export class EnvironmentsController {
  constructor(private readonly environments: EnvironmentsService) {}

  @Get("projects/:projectId/environments")
  list(@Req() request: AuthenticatedRequest, @Param("projectId") projectId: string) {
    return this.environments.list(request.user.id, projectId);
  }

  @Post("projects/:projectId/environments")
  create(
    @Req() request: AuthenticatedRequest,
    @Param("projectId") projectId: string,
    @Body() body: { name?: string; key?: string },
  ) {
    return this.environments.create(request.user.id, projectId, body);
  }

  @Patch("environments/:environmentId")
  update(
    @Req() request: AuthenticatedRequest,
    @Param("environmentId") environmentId: string,
    @Body() body: { name?: string; key?: string; sortOrder?: number },
  ) {
    return this.environments.update(request.user.id, environmentId, body);
  }

  @Delete("environments/:environmentId")
  delete(@Req() request: AuthenticatedRequest, @Param("environmentId") environmentId: string) {
    return this.environments.delete(request.user.id, environmentId);
  }
}
