import { Module } from "@nestjs/common";
import { ApiTokensModule } from "../api-tokens/api-tokens.module";
import { CommonModule } from "../common/common.module";
import { SegmentsController } from "./segments.controller";
import { SegmentsService } from "./segments.service";
import {
  SegmentAccessService,
  SegmentAuditService,
  SegmentConfigStateService,
  SegmentReferenceService,
  SegmentValidationService,
} from "./support";
import {
  CreateSegmentService,
  DeleteSegmentService,
  ListSegmentsService,
  UpdateSegmentService,
} from "./use-cases";

@Module({
  imports: [CommonModule, ApiTokensModule],
  controllers: [SegmentsController],
  providers: [
    SegmentsService,
    SegmentAccessService,
    SegmentAuditService,
    SegmentConfigStateService,
    SegmentReferenceService,
    SegmentValidationService,
    ListSegmentsService,
    CreateSegmentService,
    UpdateSegmentService,
    DeleteSegmentService,
  ],
  exports: [SegmentsService],
})
export class SegmentsModule {}
