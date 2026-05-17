import { Body, Delete, Get, Patch, Post } from "@nestjs/common";
import { SessionApiController } from "../auth/session-api-controller.decorator";
import { BulkIdsDto } from "../common/bulk-ids.dto";
import { CurrentUserId } from "../common/current-user-id.decorator";
import { UuidParam } from "../common/uuid-param.decorator";
import { CreateEnvironmentDto, UpdateEnvironmentDto } from "./dto";
import { EnvironmentsService } from "./environments.service";

@SessionApiController("api/v1")
export class EnvironmentsController {
  constructor(private readonly environments: EnvironmentsService) {}

  @Get("projects/:projectId/environments")
  list(@CurrentUserId() userId: string, @UuidParam("projectId") projectId: string) {
    return this.environments.list(userId, projectId);
  }

  @Post("projects/:projectId/environments")
  create(
    @CurrentUserId() userId: string,
    @UuidParam("projectId") projectId: string,
    @Body() body: CreateEnvironmentDto,
  ) {
    return this.environments.create(userId, projectId, body);
  }

  @Post("projects/:projectId/environments/bulk-delete")
  bulkDelete(
    @CurrentUserId() userId: string,
    @UuidParam("projectId") projectId: string,
    @Body() body: BulkIdsDto,
  ) {
    return this.environments.bulkDelete(userId, projectId, body.ids);
  }

  @Patch("environments/:environmentId")
  update(
    @CurrentUserId() userId: string,
    @UuidParam("environmentId") environmentId: string,
    @Body() body: UpdateEnvironmentDto,
  ) {
    return this.environments.update(userId, environmentId, body);
  }

  @Delete("environments/:environmentId")
  delete(@CurrentUserId() userId: string, @UuidParam("environmentId") environmentId: string) {
    return this.environments.delete(userId, environmentId);
  }
}
