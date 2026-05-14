---
applyTo: "apps/api/src/common/config-state.ts,apps/api/src/common/audit-log.ts,apps/api/src/**/*.ts"
---

Generated from `ai/registry.json`. Do not edit manually.

Canonical skill: `../../ai/skills/config-state-audit.md`.

Referenced context:
- `../../ai/rules/config-state-audit-rules.md`
- `../../ai/rules/public-config-rules.md`
- `../../ai/architecture/config-state-audit-flow.md`
- `../../ai/architecture/public-config-flow.md`
- `../../ai/examples/good-config-state-audit.md`

This file is compiled from canonical AI knowledge files. Edit canonical files under `ai`, then run `npm run ai:sync`.

# Compiled AI Skill: config-state-audit

## Canonical Skill: `ai/skills/config-state-audit.md`

# Config State And Audit

Use this skill when changing revision bumps, ETags, config environment state rows, public config invalidation, or audit logs.

## Goal

Keep SDK-visible state changes, public cache metadata, and audit logs consistent and transactional.

## Read First

- `ai/rules/config-state-audit-rules.md`
- `ai/rules/public-config-rules.md`
- `ai/architecture/config-state-audit-flow.md`
- `ai/architecture/public-config-flow.md`
- `ai/examples/good-config-state-audit.md`

## Workflow

- Determine whether the change affects public Config JSON.
- Use `bumpConfigEnvironmentState()` only for SDK-visible changes.
- Keep state bumps and audited mutations in the same Prisma transaction.
- Use `createAuditLog()` and `toAuditJson()` for audit payloads.
- Check no-op paths do not bump revision or emit audit entries unless behavior intentionally changes.

## Expected Output

- Public config revision, ETag, and generated timestamp stay consistent.
- Audit payloads are sanitized and tenant-scoped.
- No raw credentials appear in audit logs.

## Verification

- Run API tests covering changed public config or audit behavior.
- Run `npm --workspace @capture-flag/api run build` after service/helper changes.

# Referenced Context

## Reference: `ai/rules/config-state-audit-rules.md`

# Config State And Audit Rules

Rules for config environment state, revision bumps, ETags, and audit logs.

## Always

- Treat `config_environment_states` as the source of public config `revision`, `ETag`, and `generatedAt`.
- Bump config environment state only when SDK-visible output changes.
- Use `bumpConfigEnvironmentState()` inside the same transaction as the SDK-visible write.
- Generate ETags through `createConfigEnvironmentEtag()` instead of duplicating string format logic.
- Write audit logs for security-sensitive or domain-significant writes such as flag changes and SDK key lifecycle changes.
- Use `toAuditJson()` when persisting old/new/metadata snapshots.

## Never

- Do not bump revision or ETag for no-op writes.
- Do not bump public config state for UI-only metadata unless it is emitted in Config JSON.
- Do not write audit logs outside the transaction that performs the audited mutation.
- Do not include raw secrets, raw session tokens, raw SDK keys, or OAuth tokens in audit payloads.
- Do not hand-build config environment ETags in services.

## Reference: `ai/rules/public-config-rules.md`

# Public Config Rules

Rules for the SDK-visible public config endpoint and cache contract.

## Always

- Keep public endpoint semantics at `GET /public/sdk/:sdkKey/config` unless explicitly changing the contract.
- Treat the raw SDK key as a credential.
- Look up SDK keys by hash and never store or log them in plaintext.
- Return not found for missing or revoked SDK keys without exposing whether the key ever existed.
- Keep response `schemaVersion: 1` until an explicit versioned contract change is made.
- Always set `ETag` and `Cache-Control` on successful public config responses.
- Keep the default `Cache-Control` safe for SDK-key URLs; shared/CDN caching must be an explicit deployment opt-in.
- Support `If-None-Match`, including weak ETags, comma-separated values, and `*`.
- Return `304 Not Modified` with no body when the client ETag matches.
- Update `lastUsedAt` after valid SDK config access, including not-modified responses, without making telemetry writes break valid config responses.
- Read SDK key, config state, and flag values in a transaction so the body matches the revision and ETag.

## Never

- Do not send user evaluation context to this API.
- Do not evaluate flags on the API for SDK calls.
- Do not include soft-deleted flags.
- Do not generate nondeterministic public config for the same config/environment state.
- Do not change public config shape without updating `docs/CONFIG_FORMAT.md`, SDK parsing, evaluator expectations, and tests in the same change.
- Do not add backward compatibility unless an already-shipped SDK contract requires it.

## Response Shape

- Body contains `projectKey`, `configKey`, `environment`, `revision`, `generatedAt`, and `flags`.
- Flag entries contain `type`, `defaultValue`, `rules`, `percentageAttribute`, and `percentageOptions`.
- Config environment state is the source of `revision`, `ETag`, and `generatedAt`.

## Reference: `ai/architecture/config-state-audit-flow.md`

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

## Reference: `ai/architecture/public-config-flow.md`

# Public Config Flow Architecture

The public config endpoint serves the SDK-visible JSON contract.

## Endpoint

```txt
GET /public/sdk/:sdkKey/config
```

The path contains the raw SDK key. The API hashes it for lookup.

## Flow

1. Hash the raw SDK key.
2. Find an active SDK key with project, config, and environment data.
3. Return not found for missing or revoked SDK keys.
4. Read config environment state for the SDK key's `config + environment`.
5. Compare request `If-None-Match` against current ETag.
6. Return `304 Not Modified` when matched.
7. Load non-deleted feature flag environment values for that config/environment.
8. Serialize public config with deterministic flag order.
9. Update `lastUsedAt` after valid access.

## Transaction Boundary

SDK key, config state, and flag values are read in a transaction so the response body matches the revision and ETag.

## Public Body

The response body contains:

- `schemaVersion`
- `projectKey`
- `configKey`
- `environment`
- `revision`
- `generatedAt`
- `flags`

Flag values are local-evaluation data, not evaluated results.

## Reference: `ai/examples/good-config-state-audit.md`

# Good Config State And Audit

Source: `apps/api/src/common/config-state.ts` (sha256: `d9c7dc732d0680f4bd3340cb5ebcfd0cb5249ff471e00153db1800d4a1c96927`)
Source: `apps/api/src/common/audit-log.ts` (sha256: `6ec7b0b9b5fd8eb4073d46719dc01bf60c39be927b6cd3cc693ec20d409d93eb`)
Source: `apps/api/src/environments/environments.service.ts` (sha256: `de5324639c1a62766f927696f558660d410628451d1995d7029e28abc78a2e93`)

Why this is canonical:

- Keeps revision and ETag changes behind a shared helper.
- Creates config environment state when new environments are created.
- Writes audit logs through sanitized JSON payloads.

## Bump Helper

```ts
await tx.configEnvironmentState.updateMany({
  where: { configId, environmentId },
  data: {
    revision: { increment: 1 },
    generatedAt: new Date(),
  },
});
```

The helper then reads the new revision and updates the ETag in the same transaction.

## Audit Helper

```ts
await tx.auditLog.create({
  data: {
    action: input.action,
    actorUserId: input.actorUserId ?? null,
    metadata: input.metadata ?? {},
    organizationId: input.organizationId,
  },
});
```

Audit entries stay tenant-scoped and avoid raw credentials.
