---
name: "prisma-data-model"
description: "Use when changing Prisma schema, migrations, constraints, or data model invariants."
---

Generated from `ai/registry.json`. Do not edit manually.

Canonical skill: `../../../ai/skills/prisma-data-model.md`.

Referenced context:
- `../../../ai/rules/prisma-data-model-rules.md`
- `../../../ai/architecture/data-model.md`
- `../../../ai/architecture/tenant-access.md`
- `../../../ai/glossary/domain-terms.md`

This file is compiled from canonical AI knowledge files. Edit canonical files under `ai`, then run `npm run ai:sync`.

# Compiled AI Skill: prisma-data-model

## Canonical Skill: `ai/skills/prisma-data-model.md`

# Prisma Data Model

Use this skill when changing Prisma schema, migrations, database constraints, tenant relationships, or data-model documentation.

## Goal

Change the relational model without breaking tenant reachability, SDK-visible invariants, migration history, or data-model documentation.

## Read First

- `ai/rules/prisma-data-model-rules.md`
- `ai/architecture/data-model.md`
- `ai/architecture/tenant-access.md`
- `ai/glossary/domain-terms.md`

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

# Referenced Context

## Reference: `ai/rules/prisma-data-model-rules.md`

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

## Reference: `ai/architecture/data-model.md`

# Data Model Architecture

The data model supports a SaaS feature flag and remote config product.

## Primary Hierarchy

```txt
Organization
  Project
    Config
      Feature Flags
    Environment
```

## Key Relationships

- Users are global identities.
- Organization members grant access to organizations.
- Project members grant project-specific roles.
- Projects belong to organizations.
- Configs belong to projects.
- Environments belong to projects.
- Feature flags belong to configs and projects.
- Feature flag environment values bind a flag to an environment.
- SDK keys point to one config and one environment.
- Config environment states track revision, ETag, and generated timestamp per `config + environment`.

## Integrity Strategy

- Service checks provide clear error behavior.
- Database constraints enforce same-project relationships where Prisma and SQL can express them.
- Partial indexes enforce active uniqueness where Prisma cannot model the condition.
- Secrets and tokens are stored as hashes.
- Lifecycle columns such as `deletedAt`, `revokedAt`, and `acceptedAt` preserve historical state when product behavior needs it.

## Documentation Coupling

Schema or migration changes that alter relationships, constraints, or invariants must update `docs/DATA_MODEL.md`.

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

## Reference: `ai/glossary/domain-terms.md`

# Domain Terms

Core Capture Flag domain language.

## User

Authenticated platform identity. Users are global and can belong to multiple organizations.

## OAuth Account

External provider account linked to a user, such as GitHub.

## Session

Opaque client session stored in an HTTP-only cookie. The database stores only the token hash.

## Organization

Primary tenant. Organizations own projects and organization memberships.

## Organization Member

User membership and role inside an organization.

## Project

Product, application, or system inside an organization. Projects group configs, environments, SDK keys, members, and flags.

## Project Member

User membership and role scoped to one project.

## Config

Named set of flags/settings consumed by SDKs as public Config JSON.

## Environment

Runtime environment such as development, staging, or production.

## Audit Log

Minimal immutable record of important domain changes.
