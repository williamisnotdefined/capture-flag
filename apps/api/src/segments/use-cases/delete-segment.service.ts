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

export type DeleteSegmentInput = {
  configId: string;
  segmentId: string;
  userId: string;
};

@Injectable()
export class DeleteSegmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly segmentAccess: SegmentAccessService,
    private readonly segmentAudit: SegmentAuditService,
    private readonly segmentConfigState: SegmentConfigStateService,
    private readonly segmentReference: SegmentReferenceService,
  ) {}

  async execute({ userId, configId, segmentId }: DeleteSegmentInput) {
    const config = await this.segmentAccess.findConfigForWrite(userId, configId);

    await this.prisma.$transaction(
      async (tx) => {
        const currentSegment = await tx.segment.findFirst({
          where: {
            configId,
            id: segmentId,
            deletedAt: null,
          },
        });
        if (!currentSegment) {
          throw new NotFoundException("Segment not found");
        }

        await this.segmentReference.ensureSegmentIsNotReferenced(
          tx,
          configId,
          currentSegment.key,
          "delete",
        );

        const deletedSegment = await tx.segment.update({
          where: { id: segmentId },
          data: { deletedAt: new Date() },
        });
        const environmentIds = await this.segmentConfigState.bumpConfigEnvironmentStates(
          tx,
          configId,
          {
            actorUserId: userId,
            metadata: toAuditJson({ segmentId }),
            organizationId: config.project.organizationId,
            projectId: currentSegment.projectId,
            sourceAction: "segment.deleted",
            sourceEntityId: segmentId,
            sourceEntityType: "segment",
          },
        );

        await createAuditLog(tx, {
          action: "segment.deleted",
          actorUserId: userId,
          configId,
          entityId: segmentId,
          entityType: "segment",
          metadata: toAuditJson({ environmentIds }),
          newValue: this.segmentAudit.segmentAuditValue(deletedSegment),
          oldValue: this.segmentAudit.segmentAuditValue(currentSegment),
          organizationId: config.project.organizationId,
          projectId: currentSegment.projectId,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return { ok: true };
  }
}
