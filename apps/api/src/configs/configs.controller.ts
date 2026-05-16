import { Body, Delete, Get, Patch, Post } from "@nestjs/common";
import { RequireApiTokenScopes } from "../api-tokens/api-token-scopes.decorator";
import { RequireApiTokenTenant } from "../api-tokens/api-token-tenant.decorator";
import { SessionOrApiTokenController } from "../auth/session-or-api-token-controller.decorator";
import { CurrentUserId } from "../common/current-user-id.decorator";
import { UuidParam } from "../common/uuid-param.decorator";
import { ConfigsService } from "./configs.service";
import { CreateConfigDto, UpdateConfigDto } from "./dto";

@SessionOrApiTokenController("api/v1")
export class ConfigsController {
  constructor(private readonly configs: ConfigsService) {}

  @Get("projects/:projectId/configs")
  @RequireApiTokenScopes("configs:read")
  @RequireApiTokenTenant({ projectParam: "projectId" })
  list(@CurrentUserId() userId: string, @UuidParam("projectId") projectId: string) {
    return this.configs.list(userId, projectId);
  }

  @Post("projects/:projectId/configs")
  @RequireApiTokenScopes("configs:write")
  @RequireApiTokenTenant({ projectParam: "projectId" })
  create(
    @CurrentUserId() userId: string,
    @UuidParam("projectId") projectId: string,
    @Body() body: CreateConfigDto,
  ) {
    return this.configs.create(userId, projectId, body);
  }

  @Patch("configs/:configId")
  update(
    @CurrentUserId() userId: string,
    @UuidParam("configId") configId: string,
    @Body() body: UpdateConfigDto,
  ) {
    return this.configs.update(userId, configId, body);
  }

  @Delete("configs/:configId")
  delete(@CurrentUserId() userId: string, @UuidParam("configId") configId: string) {
    return this.configs.delete(userId, configId);
  }
}
