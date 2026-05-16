export function apiTokenUserSelect() {
  return {
    avatarUrl: true,
    email: true,
    id: true,
    name: true,
  } as const;
}

export function apiTokenSelect() {
  return {
    id: true,
    organizationId: true,
    projectId: true,
    userId: true,
    name: true,
    tokenPrefix: true,
    scopes: true,
    expiresAt: true,
    revokedAt: true,
    lastUsedAt: true,
    createdAt: true,
    updatedAt: true,
    user: {
      select: apiTokenUserSelect(),
    },
  } as const;
}

export function apiTokenAuthenticationSelect() {
  return {
    id: true,
    organizationId: true,
    projectId: true,
    userId: true,
    name: true,
    tokenPrefix: true,
    scopes: true,
    expiresAt: true,
    revokedAt: true,
    organization: {
      select: {
        deletedAt: true,
      },
    },
    project: {
      select: {
        deletedAt: true,
      },
    },
    user: {
      select: apiTokenUserSelect(),
    },
  } as const;
}
