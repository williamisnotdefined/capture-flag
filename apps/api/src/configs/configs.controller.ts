import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import { CreateConfigDto } from "../common/dtos";
import { ConfigsService } from "./configs.service";

@Controller()
@UseGuards(SessionGuard)
export class ConfigsController {
  constructor(private readonly configs: ConfigsService) {}

  @Get("projects/:projectId/configs")
  list(@Req() request: AuthenticatedRequest, @Param("projectId", ParseUUIDPipe) projectId: string) {
    return this.configs.list(request.user.id, projectId);
  }

  @Post("projects/:projectId/configs")
  create(
    @Req() request: AuthenticatedRequest,
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @Body() body: CreateConfigDto,
  ) {
    return this.configs.create(request.user.id, projectId, body);
  }

  @Delete("configs/:configId")
  delete(@Req() request: AuthenticatedRequest, @Param("configId", ParseUUIDPipe) configId: string) {
    return this.configs.delete(request.user.id, configId);
  }
}
