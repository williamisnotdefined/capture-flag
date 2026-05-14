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
- Segments belong to configs and projects.
- Feature flag environment values bind a flag to an environment.
- SDK keys point to one config and one environment.
- Config environment states track revision, ETag, and generated timestamp per `config + environment`.

## Integrity Strategy

- Service checks provide clear error behavior.
- Database constraints enforce same-project relationships where Prisma and SQL can express them.
- Partial indexes enforce active uniqueness where Prisma cannot model the condition.
- Secrets and tokens are stored as hashes.
- Lifecycle columns such as `deletedAt`, `revokedAt`, and `acceptedAt` preserve historical state when product behavior needs it.
- Active segment key uniqueness is enforced with a partial index so soft-deleted keys can be reused.

## Documentation Coupling

Schema or migration changes that alter relationships, constraints, or invariants must update `docs/DATA_MODEL.md`.
