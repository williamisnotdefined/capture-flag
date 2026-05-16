import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { createConfigEnvironmentEtag } from "../../common/config-state";

@Injectable()
export class ConfigEnvironmentStateService {
  async createStateRowsForConfig(
    tx: Prisma.TransactionClient,
    projectId: string,
    configId: string,
  ) {
    const environments = await tx.environment.findMany({ where: { projectId } });

    if (environments.length > 0) {
      const generatedAt = new Date();
      await tx.configEnvironmentState.createMany({
        data: environments.map((environment) => ({
          projectId,
          configId,
          environmentId: environment.id,
          revision: 1,
          etag: createConfigEnvironmentEtag(configId, environment.id, 1),
          generatedAt,
        })),
      });
    }

    return environments;
  }
}
