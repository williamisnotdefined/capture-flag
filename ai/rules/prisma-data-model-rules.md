# Prisma Data Model Rules

Rules for schema, migrations, constraints, and data model invariants.

## Always

- Keep PostgreSQL table and column names in `snake_case` through Prisma `@@map` and `@map`.
- Use UUID primary keys with `@db.Uuid` and database-generated IDs.
- Add `createdAt` and `updatedAt` to mutable entities unless there is a concrete reason not to.
- Ensure every operational entity is reachable from an organization, directly or through a project.
- Use composite relations when a child row must belong to the same project as its parent rows.
- Store secrets, session tokens, OAuth tokens, invitation tokens, and SDK keys as hashes.
- Return raw secrets only at creation time when required.
- Keep Prisma schema, SQL migrations, and `docs/DATA_MODEL.md` consistent.
- Use SQL migrations for partial indexes, expression indexes, and constraints Prisma cannot model.

## Never

- Do not edit existing migrations to change shipped history. Add a new migration.
- Do not add an entity that is not tenant-reachable unless it is explicitly global product data.
- Do not store raw credentials or tokens in database columns.
- Do not rely only on service checks when a database constraint can enforce same-project integrity.
- Do not remove the last config of a project in the MVP.

## Capture Flag Invariants

- Creating a project must create an initial config with `key = default`.
- Feature flags belong to a config.
- SDK keys point to one config and one environment.
- Config environment state is per `config + environment`.
- Boolean flags do not have a separate `enabled` field; the served boolean value is the state.
- Active feature flag key uniqueness is enforced with a partial unique SQL index.
