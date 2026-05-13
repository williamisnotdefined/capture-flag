import type { Prisma } from "@prisma/client";

export function createConfigEnvironmentEtag(
  configId: string,
  environmentId: string,
  revision: number,
): string {
  return `W/"cf-${revision}-${configId.slice(0, 8)}-${environmentId.slice(0, 8)}"`;
}

export async function bumpConfigEnvironmentState(
  tx: Prisma.TransactionClient,
  configId: string,
  environmentId: string,
) {
  const updateResult = await tx.configEnvironmentState.updateMany({
    where: {
      configId,
      environmentId,
    },
    data: {
      revision: { increment: 1 },
      generatedAt: new Date(),
    },
  });

  if (updateResult.count === 0) {
    return null;
  }

  const currentState = await tx.configEnvironmentState.findUnique({
    where: {
      configId_environmentId: {
        configId,
        environmentId,
      },
    },
    select: {
      revision: true,
    },
  });

  if (!currentState) {
    return null;
  }

  return tx.configEnvironmentState.update({
    where: {
      configId_environmentId: {
        configId,
        environmentId,
      },
    },
    data: {
      etag: createConfigEnvironmentEtag(configId, environmentId, currentState.revision),
    },
  });
}
