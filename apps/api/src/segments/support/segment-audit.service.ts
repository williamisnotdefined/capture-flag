import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { toAuditJson } from "../../common/audit-log";

@Injectable()
export class SegmentAuditService {
  segmentAuditValue(segment: {
    configId: string;
    conditionsJson: Prisma.JsonValue;
    deletedAt?: Date | null;
    description: string | null;
    id: string;
    key: string;
    name: string;
    projectId: string;
  }) {
    return toAuditJson({
      configId: segment.configId,
      conditionsJson: segment.conditionsJson,
      deletedAt: segment.deletedAt?.toISOString() ?? null,
      description: segment.description,
      id: segment.id,
      key: segment.key,
      name: segment.name,
      projectId: segment.projectId,
    });
  }
}
