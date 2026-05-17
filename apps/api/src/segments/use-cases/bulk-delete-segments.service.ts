import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createAuditLog, toAuditJson } from "../../common/audit-log";
import { PrismaService } from "../../prisma/prisma.service";
import {
  SegmentAccessService,
  SegmentAuditService,
  SegmentConfigStateService,
  SegmentReferenceService,
} from "../support";

export type BulkDeleteSegmentsInput = {
  configId: string;
  segmentIds: string[];
  userId: string;
};

@Injectable()
export class BulkDeleteSegmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly segmentAccess: SegmentAccessService,
    private readonly segmentAudit: SegmentAuditService,
    private readonly segmentConfigState: SegmentConfigStateService,
    private readonly segmentReference: SegmentReferenceService,
  ) {}

  async execute({ userId, configId, segmentIds }: BulkDeleteSegmentsInput) {
    const config = await this.segmentAccess.findConfigForWrite(userId, configId);
    const deletedAt = new Date();

    await this.prisma.$transaction(
      async (tx) => {
        const currentSegments = await tx.segment.findMany({
          where: {
            configId,
            id: { in: segmentIds },
            deletedAt: null,
          },
        });

        if (currentSegments.length !== segmentIds.length) {
          throw new NotFoundException("Segment not found");
        }

        for (const currentSegment of currentSegments) {
          await this.segmentReference.ensureSegmentIsNotReferenced(
            tx,
            configId,
            currentSegment.key,
            "delete",
          );
        }

        const deleteResult = await tx.segment.updateMany({
          where: { configId, id: { in: segmentIds }, deletedAt: null },
          data: { deletedAt },
        });

        if (deleteResult.count !== segmentIds.length) {
          throw new NotFoundException("Segment not found");
        }

        for (const currentSegment of currentSegments) {
          const environmentIds = await this.segmentConfigState.bumpConfigEnvironmentStates(
            tx,
            configId,
            {
              actorUserId: userId,
              metadata: toAuditJson({ segmentId: currentSegment.id }),
              organizationId: config.project.organizationId,
              projectId: currentSegment.projectId,
              sourceAction: "segment.deleted",
              sourceEntityId: currentSegment.id,
              sourceEntityType: "segment",
            },
          );

          await createAuditLog(tx, {
            action: "segment.deleted",
            actorUserId: userId,
            configId,
            entityId: currentSegment.id,
            entityType: "segment",
            metadata: toAuditJson({ environmentIds }),
            newValue: this.segmentAudit.segmentAuditValue({ ...currentSegment, deletedAt }),
            oldValue: this.segmentAudit.segmentAuditValue(currentSegment),
            organizationId: config.project.organizationId,
            projectId: currentSegment.projectId,
          });
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return { ok: true, count: segmentIds.length };
  }
}
