export function sdkKeySelect() {
  return {
    id: true,
    projectId: true,
    configId: true,
    environmentId: true,
    name: true,
    keyPrefix: true,
    revokedAt: true,
    lastUsedAt: true,
    createdAt: true,
    updatedAt: true,
    config: {
      select: {
        id: true,
        key: true,
        name: true,
      },
    },
    environment: {
      select: {
        id: true,
        key: true,
        name: true,
      },
    },
  } as const;
}

export function sdkKeyWithProjectSelect() {
  return {
    ...sdkKeySelect(),
    project: {
      select: {
        organizationId: true,
      },
    },
  } as const;
}
