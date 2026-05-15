# API Tenant Access

Use this skill when changing private API controllers, services, authorization, membership checks, or organization/project-scoped reads and writes in `apps/api`.

## Goal

Preserve tenant isolation by resolving parent ownership and using `AccessService` before tenant-owned reads or writes.

## Read First

- `ai/rules/api-tenant-access-rules.md`
- `ai/architecture/tenant-access.md`
- `ai/glossary/roles-and-permissions.md`
- `ai/examples/good-api-access-check.md`

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
