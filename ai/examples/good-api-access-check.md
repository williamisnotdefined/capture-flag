# Good API Access Check

Source: `apps/api/src/common/access.service.ts` (sha256: `3673b3603552b66434199b8f4c6ef127e465074b2ffb82fe6b39b3f1258dc694`)

Why this is canonical:

- Centralizes project role decisions in `AccessService`.
- Preserves the organization owner/admin override for project access.
- Forces services to resolve the parent project before authorization.

Canonical access pattern from `apps/api/src/common/access.service.ts`.

```ts
async requireProjectRole(
  userId: string,
  projectId: string,
  allowedProjectRoles: readonly ProjectRole[],
  allowedOrganizationRoles: readonly OrganizationRole[] = organizationManagerRoles,
) {
  const access = await this.requireProjectAccess(userId, projectId);

  if (allowedOrganizationRoles.includes(access.organizationRole as OrganizationRole)) {
    return access;
  }

  if (access.projectRole && allowedProjectRoles.includes(access.projectRole as ProjectRole)) {
    return access;
  }

  throw new ForbiddenException("Project role is not allowed for this action");
}
```

Services should use this after resolving the project path for the resource being changed.

## Service Usage

```ts
const config = await this.prisma.config.findUnique({
  where: { id: configId },
  select: { projectId: true },
});

if (!config) {
  throw new NotFoundException("Config not found");
}

await this.access.requireProjectAccess(userId, config.projectId);
```

The service resolves the parent project before authorizing access.
