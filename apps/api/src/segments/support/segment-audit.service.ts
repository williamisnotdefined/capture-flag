import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createAuditLog, toAuditJson } from "../../common/audit-log";

type SegmentAuditValue = {
  configId: string;
  conditionsJson: Prisma.JsonValue;
  deletedAt?: Date | null;
  description: string | null;
  id: string;
  key: string;
  name: string;
  projectId: string;
};

@Injectable()
export class SegmentAuditService {
  segmentAuditValue(segment: SegmentAuditValue) {
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

  async writeSegmentUpdated(
    tx: Prisma.TransactionClient,
    {
      actorUserId,
      changedFields,
      currentSegment,
      environmentIds,
      organizationId,
      publicChanged,
      updatedSegment,
    }: {
      actorUserId: string;
      changedFields: string[];
      currentSegment: SegmentAuditValue;
      environmentIds: string[];
      organizationId: string;
      publicChanged: boolean;
      updatedSegment: SegmentAuditValue;
    },
  ) {
    await createAuditLog(tx, {
      action: "segment.updated",
      actorUserId,
      configId: currentSegment.configId,
      entityId: updatedSegment.id,
      entityType: "segment",
      metadata: toAuditJson({ changedFields, environmentIds, publicChanged }),
      newValue: this.segmentAuditValue(updatedSegment),
      oldValue: this.segmentAuditValue(currentSegment),
      organizationId,
      projectId: currentSegment.projectId,
    });
  }
}
