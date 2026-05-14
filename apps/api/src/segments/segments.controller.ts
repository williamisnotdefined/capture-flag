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
import { CreateSegmentDto, UpdateSegmentDto } from "../common/dtos";
import { SegmentsService } from "./segments.service";

@Controller()
@UseGuards(SessionGuard)
export class SegmentsController {
  constructor(private readonly segments: SegmentsService) {}

  @Get("configs/:configId/segments")
  list(@Req() request: AuthenticatedRequest, @Param("configId", ParseUUIDPipe) configId: string) {
    return this.segments.list(request.user.id, configId);
  }

  @Post("configs/:configId/segments")
  create(
    @Req() request: AuthenticatedRequest,
    @Param("configId", ParseUUIDPipe) configId: string,
    @Body() body: CreateSegmentDto,
  ) {
    return this.segments.create(request.user.id, configId, body);
  }

  @Patch("configs/:configId/segments/:segmentId")
  update(
    @Req() request: AuthenticatedRequest,
    @Param("configId", ParseUUIDPipe) configId: string,
    @Param("segmentId", ParseUUIDPipe) segmentId: string,
    @Body() body: UpdateSegmentDto,
  ) {
    return this.segments.update(request.user.id, configId, segmentId, body);
  }

  @Delete("configs/:configId/segments/:segmentId")
  delete(
    @Req() request: AuthenticatedRequest,
    @Param("configId", ParseUUIDPipe) configId: string,
    @Param("segmentId", ParseUUIDPipe) segmentId: string,
  ) {
    return this.segments.delete(request.user.id, configId, segmentId);
  }
}
