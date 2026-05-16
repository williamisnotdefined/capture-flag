import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { toAuditJson } from "../../common/audit-log";
import { bumpConfigEnvironmentState } from "../../common/config-state";

@Injectable()
export class SegmentConfigStateService {
  async bumpForSegmentUpdate(
    tx: Prisma.TransactionClient,
    {
      actorUserId,
      configId,
      organizationId,
      projectId,
      segmentId,
    }: {
      actorUserId: string;
      configId: string;
      organizationId: string;
      projectId: string;
      segmentId: string;
    },
  ) {
    return this.bumpConfigEnvironmentStates(tx, configId, {
      actorUserId,
      metadata: toAuditJson({ segmentId }),
      organizationId,
      projectId,
      sourceAction: "segment.updated",
      sourceEntityId: segmentId,
      sourceEntityType: "segment",
    });
  }

  async bumpConfigEnvironmentStates(
    tx: Prisma.TransactionClient,
    configId: string,
    audit?: Parameters<typeof bumpConfigEnvironmentState>[3],
  ) {
    const states = await tx.configEnvironmentState.findMany({
      where: { configId },
      select: { environmentId: true },
    });

    for (const state of states) {
      await bumpConfigEnvironmentState(tx, configId, state.environmentId, audit);
    }

    return states.map((state) => state.environmentId);
  }
}
