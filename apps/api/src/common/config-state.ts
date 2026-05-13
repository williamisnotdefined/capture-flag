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

  const revision = currentState.revision + 1;

  return tx.configEnvironmentState.update({
    where: {
      configId_environmentId: {
        configId,
        environmentId,
      },
    },
    data: {
      revision,
      etag: createConfigEnvironmentEtag(configId, environmentId, revision),
      generatedAt: new Date(),
    },
  });
}
