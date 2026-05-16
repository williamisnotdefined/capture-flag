---
name: "api-tenant-access"
description: "Use when changing private API authorization, access checks, or tenant-scoped data paths."
---

Generated from `ai/registry.json`. Do not edit manually.

Canonical skill: `../../../ai/skills/api-tenant-access.md`.

Referenced context:
- `../../../ai/rules/api-tenant-access-rules.md`
- `../../../ai/architecture/tenant-access.md`
- `../../../ai/glossary/roles-and-permissions.md`
- `../../../ai/examples/good-api-access-check.md`

This file is compiled from canonical AI knowledge files. Edit canonical files under `ai`, then run `npm run ai:sync`.

# Compiled AI Skill: api-tenant-access

## Canonical Skill: `ai/skills/api-tenant-access.md`

# API Tenant Access

Use this skill when changing private API controllers, services, authorization, membership checks, or organization/project-scoped reads and writes in `apps/api`.

## Goal

Preserve tenant isolation by resolving parent ownership and using `AccessService` before tenant-owned reads or writes.

## Read First

- `ai/rules/api-tenant-access-rules.md`
- `ai/architecture/tenant-access.md`
- `ai/glossary/roles-and-permissions.md`
- `ai/examples/good-api-access-check.md`

## Related References

- Use `api-module-architecture` when access work also moves behavior between controllers, facades, use cases, support services, providers, or module exports.

## Workflow

- Identify the tenant path for every resource touched by the change.
- Keep session-only private controllers behind `SessionGuard` and `AuthenticatedRequest`.
- Keep API-token-capable management routes behind `AuthenticatedApiGuard` plus API token tenant/scope guards.
- Resolve parent organization/project/config/environment/flag data before authorizing.
- Use the narrowest `AccessService` method and role allowlist for the operation.
- Verify same-project relationships before child mutations.
- Add tests for new role gates or tenant boundary behavior.

## Expected Output

- No Prisma tenant-owned read or write relies only on a global ID.
- Includes and nested selects cannot leak cross-tenant data.
- Public SDK endpoints authenticate through hashed SDK keys, not sessions.

## Verification

- Search changed services for Prisma reads or writes by global ID and verify access checks.
- Run `npm --workspace @capture-flag/api run test` after access-sensitive changes.
- Run `npm --workspace @capture-flag/api run build` after controller or service changes.

# Referenced Context

## Reference: `ai/rules/api-tenant-access-rules.md`

# API Tenant Access Rules

Rules for private API authorization and tenant isolation.

## Always

- Use `SessionGuard` and `AuthenticatedRequest` on session-only private API controllers.
- Use `AuthenticatedApiGuard` plus API token tenant/scope guards on private management routes that also accept API tokens.
- Keep controllers thin: parse route params, pass `request.user.id`, and delegate rules to services.
- Enforce tenant access through `AccessService` before returning or mutating tenant-owned data.
- Resolve parent organization, project, config, environment, SDK key, or flag and verify it belongs to the current tenant path.
- Use `requireProjectAccess` for project-scoped reads.
- Use `requireProjectRole` for project-scoped writes with the narrowest allowed project roles.
- Use `requireOrganizationMember` or `requireOrganizationRole` for organization-level reads and writes.
- Preserve the rule that organization `owner` and `admin` roles can satisfy project access without explicit project membership.
- Preserve owner safety: organization admins cannot create, change, or remove organization owners, and organizations must keep at least one owner.
- Keep project `developer` scoped to feature flag writes; do not allow it to manage segments, SDK keys, environments, configs, project members, or roles.

## Never

- Do not trust global IDs alone.
- Do not leak cross-tenant data through `include` or nested `select` shapes.
- Do not perform private API reads or writes before access checks.
- Do not expose whether a public SDK key ever existed when it is missing or revoked.
- Do not make public SDK endpoints depend on session auth; they authenticate through hashed SDK keys.

## Required Domain Checks

- `configId` and `environmentId` must belong to the same `projectId` before SDK keys, flag values, or config state changes.
- Project ownership must be validated before listing configs, environments, members, SDK keys, and feature flags.
- Organization ownership must be validated before adding organization or project members.
- Segment mutations require project administrative access because segments are reusable targeting assets shared by flag rules.

## Reference: `ai/architecture/tenant-access.md`

# Tenant Access Architecture

Capture Flag is multi-tenant from the first MVP slice. Tenant boundaries are enforced in API services.

## Core Ownership Path

```txt
Organization
  Project
    Config
    Environment
    SDK Key
    Segment
    Feature Flag
    Feature Flag Environment Value
    Config Environment State
    Audit Log
```

Every operational entity must be reachable from an organization, directly or through a project.

## AccessService

`AccessService` centralizes private API access checks.

- `requireOrganizationMember(userId, organizationId)` verifies organization membership.
- `requireOrganizationRole(userId, organizationId, roles)` verifies allowed organization roles.
- `requireProjectAccess(userId, projectId)` verifies project read access.
- `requireProjectRole(userId, projectId, projectRoles, organizationRoles)` verifies project write access.

## Role Shortcut

Organization `owner` and `admin` roles can satisfy project access even without explicit project membership.

Organization `member` and `viewer` roles do not satisfy project access on their own. They need an explicit project membership for project reads, and a matching project role for project writes.

## Permission Boundaries

- Organization `owner`/`admin` manage organization members, organization roles, and projects, but only owners can create, change, or remove owners.
- Project `project_admin` manages project members, configs, environments, SDK keys, segments, and flags for that project.
- Project `developer` manages flags only, not project members, configs, environments, SDK keys, or segments.
- Project `viewer` is read-only.

## Integration Pattern

1. Controller parses UUID params and passes `request.user.id` to the service.
2. Service resolves the parent resource.
3. Service calls `AccessService` with the resolved organization or project.
4. Service verifies same-project relationships before child mutations.
5. Service performs Prisma reads or writes only after access is established.

## Reference: `ai/glossary/roles-and-permissions.md`

# Roles And Permissions

Role terminology used by organization and project access checks.

## Organization Roles

- `owner`: highest organization role; manages organizations, projects, members, roles, and can satisfy project access.
- `admin`: organization administrator; manages organization members/projects except owner role changes, and can satisfy project access.
- `member`: organization member without admin shortcut.
- `viewer`: read-oriented organization member.

## Project Roles

- `project_admin`: project-level administrator; manages project members, configs, environments, SDK keys, segments, and flags.
- `developer`: can create, update, and delete feature flags in projects where the role was granted.
- `viewer`: read-oriented project member.

## Access Concepts

- Organization membership is required before organization-scoped reads or writes.
- Project access can come from organization `owner`/`admin` or explicit project membership.
- Project writes must use `requireProjectRole` with narrow allowed project roles.
- Organization writes must use `requireOrganizationRole` with narrow allowed organization roles.

## Permission Matrix

- Organization `owner`/`admin`: create projects, manage organization members, manage organization roles, and satisfy project-level administrative actions through the organization shortcut. Only owners can create, change, or remove owners.
- Project `project_admin`: manage project members, configs, environments, SDK keys, segments, and feature flags only for projects where this role was granted.
- Project `developer`: create, update, and delete feature flags only for projects where this role was granted.
- Project `viewer`: read project resources only.
- Organization `member`/`viewer` without a project role cannot access project resources.

## Reference: `ai/examples/good-api-access-check.md`

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
