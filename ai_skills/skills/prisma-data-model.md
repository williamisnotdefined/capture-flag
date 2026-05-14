# Prisma Data Model

Use this skill when changing Prisma schema, migrations, database constraints, tenant relationships, or data-model documentation.

## Goal

Change the relational model without breaking tenant reachability, SDK-visible invariants, migration history, or data-model documentation.

## Read First

- `ai_skills/rules/prisma-data-model-rules.md`
- `ai_skills/architecture/data-model.md`
- `ai_skills/architecture/tenant-access.md`
- `ai_skills/glossary/domain-terms.md`

## External Docs

- `docs/DATA_MODEL.md`
- `docs/TECHNICAL_DECISIONS.md`

## Workflow

- Identify affected entities, tenant ownership path, and service queries.
- Update Prisma schema and add a new migration when schema changes are required.
- Use SQL migration statements for constraints Prisma cannot model.
- Keep service-level checks for clear error behavior even when database constraints exist.
- Update docs when relationships, constraints, or invariants change.

## Expected Output

- Operational entities remain organization-reachable.
- Secrets and tokens remain hashed.
- Config, environment, SDK key, feature flag, and config state invariants remain intact.
- Existing migrations are not edited.

## Verification

- Run `npm --workspace @capture-flag/api run db:generate` after Prisma schema changes.
- Run `npm --workspace @capture-flag/api run build` after generated client or model changes.
- Run relevant API tests for services that use changed models.
