# Config State And Audit Flow Architecture

Config environment state connects private writes to public SDK cache behavior.

## Config Environment State

- One row represents one `config + environment` public config state.
- It stores `revision`, `etag`, and `generatedAt` used by the public Config JSON endpoint.
- Environment creation creates state rows for all existing project configs.

## Revision Bump Flow

1. A service performs an SDK-visible write inside a Prisma transaction.
2. The service calls `bumpConfigEnvironmentState(tx, configId, environmentId)` in that transaction.
3. The helper increments `revision`, updates `generatedAt`, reads the new revision, and updates `etag` through `createConfigEnvironmentEtag()`.
4. Public config then exposes the updated revision and ETag.

## Audit Flow

- Audited mutations write `audit_logs` in the same transaction as the domain write.
- Audit entries include action, actor, entity, tenant identifiers, and sanitized metadata/old/new snapshots.
- Audit payloads must not contain raw credentials or OAuth/session tokens.
- Audit logs are append-only investigation records and must survive resource lifecycle changes.
- Private audit reads support tenant-scoped filters by actor, entity, period, project, and config.
