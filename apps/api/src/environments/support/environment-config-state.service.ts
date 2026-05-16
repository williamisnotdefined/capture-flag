import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { toAuditJson } from "../../common/audit-log";
import { bumpConfigEnvironmentState, createConfigEnvironmentEtag } from "../../common/config-state";

@Injectable()
export class EnvironmentConfigStateService {
  async createStateRowsForEnvironment(
    tx: Prisma.TransactionClient,
    projectId: string,
    environmentId: string,
  ) {
    const configs = await tx.config.findMany({ where: { projectId } });

    if (configs.length > 0) {
      await tx.configEnvironmentState.createMany({
        data: configs.map((config) => ({
          projectId,
          configId: config.id,
          environmentId,
          revision: 1,
          etag: createConfigEnvironmentEtag(config.id, environmentId, 1),
          generatedAt: new Date(),
        })),
      });
    }

    return configs;
  }

  async bumpStatesForEnvironmentKeyChange(
    tx: Prisma.TransactionClient,
    input: {
      environmentId: string;
      organizationId: string;
      projectId: string;
      userId: string;
    },
  ) {
    const states = await tx.configEnvironmentState.findMany({
      where: {
        environmentId: input.environmentId,
        projectId: input.projectId,
      },
      select: { configId: true },
    });

    for (const state of states) {
      await bumpConfigEnvironmentState(tx, state.configId, input.environmentId, {
        actorUserId: input.userId,
        metadata: toAuditJson({ environmentId: input.environmentId }),
        organizationId: input.organizationId,
        projectId: input.projectId,
        sourceAction: "environment.updated",
        sourceEntityId: input.environmentId,
        sourceEntityType: "environment",
      });
    }
  }
}
