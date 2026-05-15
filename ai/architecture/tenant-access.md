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
