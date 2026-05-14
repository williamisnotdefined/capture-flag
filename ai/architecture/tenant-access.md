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
