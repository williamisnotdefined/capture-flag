import { Injectable } from "@nestjs/common";
import {
  CreateSegmentService,
  DeleteSegmentService,
  ListSegmentsService,
  UpdateSegmentService,
} from "./use-cases";

@Injectable()
export class SegmentsService {
  constructor(
    private readonly listSegments: ListSegmentsService,
    private readonly createSegment: CreateSegmentService,
    private readonly updateSegment: UpdateSegmentService,
    private readonly deleteSegment: DeleteSegmentService,
  ) {}

  list(userId: string, configId: string) {
    return this.listSegments.execute({ userId, configId });
  }

  create(
    userId: string,
    configId: string,
    input: {
      conditionsJson?: unknown;
      description?: string;
      key?: string;
      name?: string;
    },
  ) {
    return this.createSegment.execute({ userId, configId, input });
  }

  update(
    userId: string,
    configId: string,
    segmentId: string,
    input: {
      conditionsJson?: unknown;
      description?: string;
      key?: string;
      name?: string;
    },
  ) {
    return this.updateSegment.execute({ userId, configId, segmentId, input });
  }

  delete(userId: string, configId: string, segmentId: string) {
    return this.deleteSegment.execute({ userId, configId, segmentId });
  }
}
