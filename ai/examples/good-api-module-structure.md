# Good API Module Structure

Source: `apps/api/src/projects/projects.controller.ts` (sha256: `1a81390937f3ed3f00c344377fc8858826227237732a4c9b910ba7f94a19723e`)
Source: `apps/api/src/projects/projects.service.ts` (sha256: `baa9858a86c5899374774b72ba7cfb7afbb95e678460b5ce472105592778ccec`)
Source: `apps/api/src/projects/projects.module.ts` (sha256: `1b5e81eefa3a22df991ce941803fd1af6e88959c5372c34a9c9418a9ff34b747`)
Source: `apps/api/src/projects/use-cases/create-project.service.ts` (sha256: `630ab9ddd6c6a9d768e60efc436fe847a18de094a99afffeb74b82f1adc00a7a`)
Source: `apps/api/src/projects/support/project-audit.service.ts` (sha256: `6b85227686e8f9d8fe5e3b207faedd11faceb7508a66dcc826f6542603c784a2`)

Why this is canonical:

- Keeps the controller focused on decorators, params, identity, DTOs, and delegation.
- Keeps the facade service as a stable module boundary that delegates to operation-specific use cases.
- Keeps the use case responsible for access, transaction, Prisma writes, bootstrap side effects, and audit writes.
- Keeps audit payload shaping in a focused support service.
- Registers providers explicitly and exports only the module facade.

## Thin Controller

```ts
@Get("organizations/:organizationId/projects")
listForOrganization(
  @CurrentUserId() userId: string,
  @UuidParam("organizationId") organizationId: string,
) {
  return this.projects.listForOrganization(userId, organizationId);
}
```

The controller parses the route and authenticated user, then delegates.

## Facade Boundary

```ts
listForOrganization(userId: string, organizationId: string) {
  return this.listOrganizationProjects.execute({ userId, organizationId });
}
```

The facade exposes controller-friendly methods while use cases own behavior.

## Use Case Ownership

```ts
await this.access.requireOrganizationRole(userId, organizationId, organizationManagerRoles);

return this.prisma.$transaction(async (tx) => {
  const project = await tx.project.create({
    data: {
      organizationId,
      name,
      slug,
    },
  });
});
```

The use case resolves authorization before tenant-owned writes and keeps related writes in a transaction.

## Support Responsibility

```ts
configAuditValue(config: {
  description?: string | null;
  id: string;
  key: string;
  name: string;
  projectId: string;
}) {
  return toAuditJson({
    description: config.description ?? null,
    id: config.id,
    key: config.key,
    name: config.name,
    projectId: config.projectId,
  });
}
```

The support service owns sanitized audit value shaping instead of spreading payload details across use cases.

## Module Wiring

```ts
@Module({
  imports: [CommonModule, ApiTokensModule],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    ProjectAuditService,
    ProjectMemberTargetService,
    ListOrganizationProjectsService,
    CreateProjectService,
  ],
  exports: [ProjectsService],
})
export class ProjectsModule {}
```

The module declares internal providers explicitly and exports only the facade boundary.
