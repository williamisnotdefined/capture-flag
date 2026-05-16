import { Injectable } from "@nestjs/common";
import { createAuditLog, toAuditJson } from "../../common/audit-log";
import { PrismaService } from "../../prisma/prisma.service";
import {
  SegmentAccessService,
  SegmentAuditService,
  SegmentConfigStateService,
  SegmentValidationService,
} from "../support";

export type CreateSegmentInput = {
  configId: string;
  input: {
    conditionsJson?: unknown;
    description?: string;
    key?: string;
    name?: string;
  };
  userId: string;
};

@Injectable()
export class CreateSegmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly segmentAccess: SegmentAccessService,
    private readonly segmentAudit: SegmentAuditService,
    private readonly segmentConfigState: SegmentConfigStateService,
    private readonly segmentValidation: SegmentValidationService,
  ) {}

  async execute({ userId, configId, input }: CreateSegmentInput) {
    const config = await this.segmentAccess.findConfigForCreate(userId, configId);
    const key = this.segmentValidation.normalizeSegmentKey(input.key);
    const name = this.segmentValidation.normalizeSegmentName(input.name);
    const conditionsJson = this.segmentValidation.normalizeConditionsJson(
      input.conditionsJson ?? [],
    );

    return this.prisma.$transaction(async (tx) => {
      const segment = await tx.segment.create({
        data: {
          projectId: config.projectId,
          configId,
          key,
          name,
          description: input.description?.trim() || null,
          conditionsJson,
        },
      });

      const environmentIds = await this.segmentConfigState.bumpConfigEnvironmentStates(
        tx,
        configId,
        {
          actorUserId: userId,
          metadata: toAuditJson({ segmentId: segment.id }),
          organizationId: config.project.organizationId,
          projectId: config.projectId,
          sourceAction: "segment.created",
          sourceEntityId: segment.id,
          sourceEntityType: "segment",
        },
      );

      await createAuditLog(tx, {
        action: "segment.created",
        actorUserId: userId,
        configId,
        entityId: segment.id,
        entityType: "segment",
        metadata: toAuditJson({ environmentIds }),
        newValue: this.segmentAudit.segmentAuditValue(segment),
        organizationId: config.project.organizationId,
        projectId: config.projectId,
      });

      return segment;
    });
  }
}
