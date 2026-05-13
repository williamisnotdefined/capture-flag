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
import { CreateEnvironmentDto, UpdateEnvironmentDto } from "../common/dtos";
import { EnvironmentsService } from "./environments.service";

@Controller()
@UseGuards(SessionGuard)
export class EnvironmentsController {
  constructor(private readonly environments: EnvironmentsService) {}

  @Get("projects/:projectId/environments")
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
