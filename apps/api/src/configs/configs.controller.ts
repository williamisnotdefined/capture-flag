import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import { ConfigsService } from "./configs.service";

@Controller()
@UseGuards(SessionGuard)
export class ConfigsController {
  constructor(private readonly configs: ConfigsService) {}

  @Get("projects/:projectId/configs")
  list(@Req() request: AuthenticatedRequest, @Param("projectId") projectId: string) {
    return this.configs.list(request.user.id, projectId);
  }

  @Post("projects/:projectId/configs")
  create(
    @Req() request: AuthenticatedRequest,
    @Param("projectId") projectId: string,
    @Body() body: { key?: string; name?: string; description?: string },
  ) {
    return this.configs.create(request.user.id, projectId, body);
  }

  @Delete("configs/:configId")
  delete(@Req() request: AuthenticatedRequest, @Param("configId") configId: string) {
    return this.configs.delete(request.user.id, configId);
  }
}
