---
applyTo: "apps/api/src/**/*.ts"
---

Generated from `ai_skills/registry.json`. Do not edit manually.

Canonical skill: `../../ai_skills/skills/api-tenant-access.md`.

Referenced context:
- `../../ai_skills/rules/api-tenant-access-rules.md`
- `../../ai_skills/architecture/tenant-access.md`
- `../../ai_skills/glossary/roles-and-permissions.md`
- `../../ai_skills/examples/good-api-access-check.md`

This file is compiled from canonical AI knowledge files. Edit canonical files under `ai_skills`, then run `npm run ai-skills:sync`.

# Compiled AI Skill: api-tenant-access

## Canonical Skill: `ai_skills/skills/api-tenant-access.md`

# API Tenant Access

Use this skill when changing private API controllers, services, authorization, membership checks, or organization/project-scoped reads and writes in `apps/api`.

## Goal

Preserve tenant isolation by resolving parent ownership and using `AccessService` before tenant-owned reads or writes.

## Read First

- `ai_skills/rules/api-tenant-access-rules.md`
- `ai_skills/architecture/tenant-access.md`
- `ai_skills/glossary/roles-and-permissions.md`
- `ai_skills/examples/good-api-access-check.md`

## Workflow

- Identify the tenant path for every resource touched by the change.
- Keep private controllers behind `SessionGuard` and `AuthenticatedRequest`.
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

## Reference: `ai_skills/rules/api-tenant-access-rules.md`

# API Tenant Access Rules

Rules for private API authorization and tenant isolation.

## Always

- Use `SessionGuard` and `AuthenticatedRequest` on private API controllers.
- Keep controllers thin: parse route params, pass `request.user.id`, and delegate rules to services.
- Enforce tenant access through `AccessService` before returning or mutating tenant-owned data.
- Resolve parent organization, project, config, environment, SDK key, or flag and verify it belongs to the current tenant path.
- Use `requireProjectAccess` for project-scoped reads.
- Use `requireProjectRole` for project-scoped writes with the narrowest allowed project roles.
- Use `requireOrganizationMember` or `requireOrganizationRole` for organization-level reads and writes.
- Preserve the rule that organization `owner` and `admin` roles can satisfy project access without explicit project membership.

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

## Reference: `ai_skills/architecture/tenant-access.md`

# Tenant Access Architecture

Capture Flag is multi-tenant from the first MVP slice. Tenant boundaries are enforced in API services.

## Core Ownership Path

```txt
Organization
  Project
    Config
    Environment
    SDK Key
    Feature Flag
    Feature Flag Environment Value
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

## Integration Pattern

1. Controller parses UUID params and passes `request.user.id` to the service.
2. Service resolves the parent resource.
3. Service calls `AccessService` with the resolved organization or project.
4. Service verifies same-project relationships before child mutations.
5. Service performs Prisma reads or writes only after access is established.

## Reference: `ai_skills/glossary/roles-and-permissions.md`

# Roles And Permissions

Role terminology used by organization and project access checks.

## Organization Roles

- `owner`: highest organization role; can satisfy project access.
- `admin`: organization administrator; can satisfy project access.
- `member`: organization member without admin shortcut.
- `viewer`: read-oriented organization member.

## Project Roles

- `project_admin`: project-level administrator.
- `developer`: can perform project write operations where allowed.
- `viewer`: read-oriented project member.

## Access Concepts

- Organization membership is required before organization-scoped reads or writes.
- Project access can come from organization `owner`/`admin` or explicit project membership.
- Project writes must use `requireProjectRole` with narrow allowed project roles.
- Organization writes must use `requireOrganizationRole` with narrow allowed organization roles.

## Reference: `ai_skills/examples/good-api-access-check.md`

# Good API Access Check

Source: `apps/api/src/common/access.service.ts` (sha256: `1858537f302e4abb94a33f49c45dc998daec5962cc185d83849aac21a66bfd76`)

Why this is canonical:

- Centralizes project role decisions in `AccessService`.
- Preserves the organization owner/admin override for project access.
- Forces services to resolve the parent project before authorization.

Canonical access pattern from `apps/api/src/common/access.service.ts`.

```ts
async requireProjectRole(
  userId: string,
  projectId: string,
  allowedProjectRoles: ProjectRole[],
  allowedOrganizationRoles: OrganizationRole[] = ["owner", "admin"],
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
