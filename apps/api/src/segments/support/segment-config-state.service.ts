import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { bumpConfigEnvironmentState } from "../../common/config-state";

@Injectable()
export class SegmentConfigStateService {
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
