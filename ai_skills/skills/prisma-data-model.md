# Prisma Data Model

Use this skill when changing Prisma schema, migrations, database constraints, tenant relationships, or data-model documentation.

## Rules

- Keep PostgreSQL table and column names in `snake_case` through Prisma `@@map` and `@map`.
- Use UUID primary keys with `@db.Uuid` and database-generated IDs.
- Add `createdAt` and `updatedAt` to mutable entities unless there is a concrete reason not to.
- Every operational entity must be reachable from an organization, directly or through a project.
- Use composite relations when a child row must belong to the same project as its parent rows.
- Store secrets, session tokens, OAuth tokens, invitation tokens, and SDK keys as hashes. Return raw secrets only at creation time when required.
- Use soft-delete or lifecycle columns such as `deletedAt`, `revokedAt`, or `acceptedAt` when product behavior needs historical state.
- Do not edit existing migrations to change shipped history. Add a new migration.

## Capture Flag Invariants

- Creating a project must create an initial config with `key = default`.
- Feature flags belong to a config; SDK keys point to a config and environment; config environment state is per `config + environment`.
- Config and environment references must be verified to belong to the same project.
- The last config of a project should not be removable in the MVP.
- Boolean flags do not have a separate `enabled` field; the served boolean value is the state.
- Feature flag soft delete uses `deleted_at`.
- Active feature flag key uniqueness is enforced with a partial unique SQL index because Prisma cannot express that constraint directly.

## Migration Guidance

- Keep Prisma schema, SQL migrations, and `docs/DATA_MODEL.md` consistent.
- Use SQL migrations for partial indexes, expression indexes, and constraints Prisma cannot model.
- Add indexes for tenant lookups and public config paths that are used by services.
- Prefer database constraints for same-project integrity when possible, then keep service-level checks for clear error behavior.

## Verification

- Run `npm --workspace @capture-flag/api run db:generate` after Prisma schema changes.
- Run `npm --workspace @capture-flag/api run build` after generated client or model changes.
- Run relevant API tests for services that use changed models.
- Update `docs/DATA_MODEL.md` when schema changes alter domain invariants, relationships, or constraints.
