import { Body, Delete, Get, Patch, Post } from "@nestjs/common";
import { RequireApiTokenScopes } from "../api-tokens/api-token-scopes.decorator";
import { RequireApiTokenTenant } from "../api-tokens/api-token-tenant.decorator";
import { SessionOrApiTokenController } from "../auth/session-or-api-token-controller.decorator";
import { CurrentUserId } from "../common/current-user-id.decorator";
import { UuidParam } from "../common/uuid-param.decorator";
import { CreateSegmentDto, UpdateSegmentDto } from "./dto";
import {
  CreateSegmentService,
  DeleteSegmentService,
  ListSegmentsService,
  UpdateSegmentService,
} from "./use-cases";

@SessionOrApiTokenController("api/v1")
export class SegmentsController {
  constructor(
    private readonly listSegments: ListSegmentsService,
    private readonly createSegment: CreateSegmentService,
    private readonly updateSegment: UpdateSegmentService,
    private readonly deleteSegment: DeleteSegmentService,
  ) {}

  @Get("configs/:configId/segments")
  @RequireApiTokenScopes("segments:read")
  @RequireApiTokenTenant({ configParam: "configId" })
  list(@CurrentUserId() userId: string, @UuidParam("configId") configId: string) {
    return this.listSegments.execute({ userId, configId });
  }

  @Post("configs/:configId/segments")
  @RequireApiTokenScopes("segments:write")
  @RequireApiTokenTenant({ configParam: "configId" })
  create(
    @CurrentUserId() userId: string,
    @UuidParam("configId") configId: string,
    @Body() input: CreateSegmentDto,
  ) {
    return this.createSegment.execute({ userId, configId, input });
  }

  @Patch("configs/:configId/segments/:segmentId")
  @RequireApiTokenScopes("segments:write")
  @RequireApiTokenTenant({ configParam: "configId", segmentParam: "segmentId" })
  update(
    @CurrentUserId() userId: string,
    @UuidParam("configId") configId: string,
    @UuidParam("segmentId") segmentId: string,
    @Body() input: UpdateSegmentDto,
  ) {
    return this.updateSegment.execute({ userId, configId, segmentId, input });
  }

  @Delete("configs/:configId/segments/:segmentId")
  @RequireApiTokenScopes("segments:write")
  @RequireApiTokenTenant({ configParam: "configId", segmentParam: "segmentId" })
  delete(
    @CurrentUserId() userId: string,
    @UuidParam("configId") configId: string,
    @UuidParam("segmentId") segmentId: string,
  ) {
    return this.deleteSegment.execute({ userId, configId, segmentId });
  }
}
