import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  SegmentAccessService,
  SegmentAuditService,
  SegmentConfigStateService,
  SegmentReferenceService,
  type SegmentUpdateInput as SegmentUpdateFields,
  SegmentUpdateInputService,
} from "../support";

export type UpdateSegmentInput = {
  configId: string;
  input: SegmentUpdateFields;
  segmentId: string;
  userId: string;
};

@Injectable()
export class UpdateSegmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly segmentAccess: SegmentAccessService,
    private readonly segmentAudit: SegmentAuditService,
    private readonly segmentConfigState: SegmentConfigStateService,
    private readonly segmentReference: SegmentReferenceService,
    private readonly segmentUpdateInput: SegmentUpdateInputService,
  ) {}

  async execute({ userId, configId, segmentId, input }: UpdateSegmentInput) {
    const config = await this.segmentAccess.findConfigForWrite(userId, configId);
    const segment = await this.segmentAccess.findActiveSegment(configId, segmentId);

    const update = this.segmentUpdateInput.normalize({ input, segment });

    if (update.changedFields.length === 0) {
      return segment;
    }

    return this.prisma.$transaction(
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

        if (update.publicUpdate.key !== undefined) {
          await this.segmentReference.ensureSegmentIsNotReferenced(
            tx,
            currentSegment.configId,
            currentSegment.key,
            "rename",
          );
        }

        const updatedSegment = await tx.segment.update({
          where: { id: segmentId },
          data: update.data,
        });

        const environmentIds = update.publicChanged
          ? await this.segmentConfigState.bumpForSegmentUpdate(tx, {
              actorUserId: userId,
              configId: currentSegment.configId,
              projectId: currentSegment.projectId,
              organizationId: config.project.organizationId,
              segmentId,
            })
          : [];

        await this.segmentAudit.writeSegmentUpdated(tx, {
          actorUserId: userId,
          changedFields: update.changedFields,
          currentSegment,
          environmentIds,
          organizationId: config.project.organizationId,
          publicChanged: update.publicChanged,
          updatedSegment,
        });

        return updatedSegment;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
