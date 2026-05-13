# API Tenant Access

Use this skill when changing private API controllers, services, authorization, membership checks, or organization/project-scoped reads and writes in `apps/api`.

## Rules

- Private API controllers must use `SessionGuard` and `AuthenticatedRequest`.
- Controllers stay thin: parse route params, pass `request.user.id`, and delegate authorization and business rules to services.
- Services must enforce tenant access through `AccessService` before returning or mutating tenant-owned data.
- Never trust global IDs alone. Resolve the parent organization, project, config, environment, SDK key, or flag and verify it belongs to the current tenant path.
- Use `requireProjectAccess` for project-scoped reads.
- Use `requireProjectRole` for project-scoped writes and pass the narrowest allowed project roles.
- Use `requireOrganizationMember` or `requireOrganizationRole` for organization-level reads and writes.
- Preserve the existing rule that organization `owner` and `admin` roles can satisfy project access without explicit project membership.
- Public SDK endpoints are intentionally unauthenticated but must authenticate access through hashed SDK keys.

## Domain Checks

- Validate that `configId` and `environmentId` belong to the same `projectId` before creating SDK keys, flag values, or config state.
- Validate project ownership before listing configs, environments, members, SDK keys, and feature flags.
- Validate organization ownership before adding organization or project members.
- Do not leak cross-tenant data in includes or nested selects.
- Keep forbidden, not found, and bad request semantics aligned with nearby services.

## Controller Convention

```ts
@UseGuards(SessionGuard)
@Get("projects/:projectId/resources")
list(
  @Req() request: AuthenticatedRequest,
  @Param("projectId", ParseUUIDPipe) projectId: string,
) {
  return this.resources.list(request.user.id, projectId);
}
```

## Verification

- Search changed services for Prisma reads or writes by global ID and verify each path has an access check.
- Add or update tests for new role gates and tenant boundary behavior.
- Run `npm --workspace @capture-flag/api run test` after access-sensitive API changes.
- Run `npm --workspace @capture-flag/api run build` after controller or service changes.
