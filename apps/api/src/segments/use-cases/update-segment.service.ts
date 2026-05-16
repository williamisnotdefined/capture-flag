import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createAuditLog, toAuditJson } from "../../common/audit-log";
import { PrismaService } from "../../prisma/prisma.service";
import {
  SegmentAccessService,
  SegmentAuditService,
  SegmentConfigStateService,
  SegmentReferenceService,
  SegmentValidationService,
} from "../support";

type SegmentPublicUpdate = {
  conditionsJson?: Prisma.InputJsonValue;
  key?: string;
};

export type UpdateSegmentInput = {
  configId: string;
  input: {
    conditionsJson?: unknown;
    description?: string;
    key?: string;
    name?: string;
  };
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
    private readonly segmentValidation: SegmentValidationService,
  ) {}

  async execute({ userId, configId, segmentId, input }: UpdateSegmentInput) {
    const config = await this.segmentAccess.findConfigForWrite(userId, configId);
    const segment = await this.segmentAccess.findActiveSegment(configId, segmentId);

    const data: Prisma.SegmentUncheckedUpdateInput = {};
    const publicUpdate: SegmentPublicUpdate = {};
    let receivedAnyField = false;

    if (input.key !== undefined) {
      receivedAnyField = true;
      const key = this.segmentValidation.normalizeSegmentKey(input.key);
      if (key !== segment.key) {
        data.key = key;
        publicUpdate.key = key;
      }
    }

    if (input.name !== undefined) {
      receivedAnyField = true;
      const name = this.segmentValidation.normalizeSegmentName(input.name);
      if (name !== segment.name) {
        data.name = name;
      }
    }

    if (input.description !== undefined) {
      receivedAnyField = true;
      const description = input.description.trim() || null;
      if (description !== segment.description) {
        data.description = description;
      }
    }

    if (input.conditionsJson !== undefined) {
      receivedAnyField = true;
      const conditionsJson = this.segmentValidation.normalizeConditionsJson(input.conditionsJson);
      if (!this.segmentValidation.jsonValuesEqual(segment.conditionsJson, conditionsJson)) {
        data.conditionsJson = conditionsJson;
        publicUpdate.conditionsJson = conditionsJson;
      }
    }

    if (!receivedAnyField) {
      throw new BadRequestException("No segment fields to update");
    }

    if (Object.keys(data).length === 0) {
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

        if (publicUpdate.key !== undefined) {
          await this.segmentReference.ensureSegmentIsNotReferenced(
            tx,
            configId,
            currentSegment.key,
            "rename",
          );
        }

        const updatedSegment = await tx.segment.update({
          where: { id: segmentId },
          data,
        });
        const changedFields = Object.keys(data);
        const publicChanged = Object.keys(publicUpdate).length > 0;
        const environmentIds = publicChanged
          ? await this.segmentConfigState.bumpConfigEnvironmentStates(tx, configId, {
              actorUserId: userId,
              metadata: toAuditJson({ segmentId }),
              organizationId: config.project.organizationId,
              projectId: currentSegment.projectId,
              sourceAction: "segment.updated",
              sourceEntityId: segmentId,
              sourceEntityType: "segment",
            })
          : [];

        await createAuditLog(tx, {
          action: "segment.updated",
          actorUserId: userId,
          configId,
          entityId: segmentId,
          entityType: "segment",
          metadata: toAuditJson({ changedFields, environmentIds, publicChanged }),
          newValue: this.segmentAudit.segmentAuditValue(updatedSegment),
          oldValue: this.segmentAudit.segmentAuditValue(currentSegment),
          organizationId: config.project.organizationId,
          projectId: currentSegment.projectId,
        });

        return updatedSegment;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
