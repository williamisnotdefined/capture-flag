---
applyTo: "apps/api/src/public-sdk/**/*.ts,apps/api/src/common/config-state.ts,docs/CONFIG_FORMAT.md,docs/ROADMAP.md"
---

Generated from `ai/registry.json`. Do not edit manually.

Canonical skill: `../../ai/skills/api-public-config-contract.md`.

Referenced context:
- `../../ai/glossary/config-sdk-terms.md`
- `../../ai/rules/public-config-rules.md`
- `../../ai/architecture/public-config-flow.md`
- `../../ai/examples/good-public-config-service.md`

This file is compiled from canonical AI knowledge files. Edit canonical files under `ai`, then run `npm run ai:sync`.

# Compiled AI Skill: api-public-config-contract

## Canonical Skill: `ai/skills/api-public-config-contract.md`

# API Public Config Contract

Use this skill when changing the public SDK config endpoint, SDK key lookup, ETags, cache behavior, config revisioning, or public flag serialization.

## Goal

Preserve the SDK-visible Config JSON contract and HTTP cache semantics while keeping evaluation local to SDKs.

## Read First

- `ai/glossary/config-sdk-terms.md`
- `ai/rules/public-config-rules.md`
- `ai/architecture/public-config-flow.md`
- `ai/examples/good-public-config-service.md`

## External Docs

- `docs/CONFIG_FORMAT.md`

## Workflow

- Identify whether the change affects SDK key lookup, ETags, cache headers, revision state, public body shape, or flag serialization.
- Keep SDK key lookup hashed and public routes session-free.
- Keep default cache headers safe for SDK-key URLs; shared cache behavior must be explicit.
- Keep reads transactionally consistent with config environment state.
- Keep advanced targeting data serialized, not evaluated, in public `rules`.
- Update public config tests for 200 and 304 paths when cache behavior changes.
- Update SDK/evaluator parsing and tests when public config shape changes.

## Expected Output

- Public config remains deterministic for the same config/environment state.
- User evaluation context is not sent to the API.
- Soft-deleted flags are excluded.
- `lastUsedAt` updates after valid SDK access, including not-modified responses, without making telemetry writes break valid responses.

## Verification

- Update `apps/api/test/public-sdk.service.spec.ts` or equivalent tests for contract changes.
- Run `npm --workspace @capture-flag/api run test` after public config changes.
- Run SDK/evaluator tests when public config shape changes.

# Referenced Context

## Reference: `ai/glossary/config-sdk-terms.md`

# Config And SDK Terms

Terms shared by API, public config, evaluator, SDK, and client UI.

## Feature Flag

SDK-visible setting controlled by Capture Flag. Supported types are `boolean`, `string`, `integer`, `double`, `json_object`, and `json_array`.

## Default Value

Configured flag value stored in the database and emitted in Config JSON. This is not the same as SDK fallback value.

## Fallback Value

Value supplied by application code when calling `getValue`. The SDK returns fallback when config is unavailable, invalid, missing, or type-mismatched.

## Rules

Ordered targeting rules emitted as `rules` in public Config JSON. The evaluator checks rules before percentage rollout.

## Segment

Reusable group of attribute conditions scoped to one config and emitted as `segments` in public Config JSON.

## Segment Reference

A rule condition shaped as `{ "segment": "segment-key" }`. It is evaluated locally by checking the referenced segment conditions against the Evaluation Context.

## Prerequisite Flag

A rule condition shaped as `{ "prerequisiteFlag": "flag-key", "operator": "equals", "value": true }`. It evaluates another flag from the same Config JSON locally before deciding whether the current rule matches.

## Advanced Targeting

Targeting features beyond simple attribute equality: prerequisite flags, `arrayContains`, date comparisons, and SemVer comparisons.

## Percentage Rollout

Deterministic distribution of values based on a rollout attribute such as `identifier`.

## Percentage Attribute

Context attribute used for rollout bucketing. Defaults to `identifier`.

## SDK Key

Read-only credential scoped to one config and one environment. Stored as a hash in the API database.

## Raw SDK Key

The full SDK credential shown only immediately after creation. It must never be stored, logged, audited, or re-displayed.

## Key Prefix

Display-safe prefix derived from the raw SDK key and stored for UI identification and audit metadata.

## Config JSON

Versioned public JSON downloaded by SDKs. It contains local-evaluation data, not evaluated flag results.

## React SDK

React provider and hook package that receives a JavaScript SDK client and evaluates flags through that client.

## Config Environment State

Per `config + environment` state that stores revision, ETag, and generated timestamp for public config caching.

## ETag

HTTP cache validator used by SDK clients through `If-None-Match`.

## Lazy Loading

Default SDK mode. The client fetches config only when no cache exists or when the cached entry is older than `cacheTtlMs`.

## Auto Polling

SDK mode where the JavaScript client refreshes config in the background on `pollIntervalMs`.

## Manual Refresh

SDK mode where `getValue` uses the current cache and the application calls `refresh()` to fetch new config.

## Offline Mode

SDK mode where the client uses only existing cache and never performs network requests.

## Memory Cache

Default in-process SDK cache used by every client instance.

## localStorage Cache

Browser persistent cache enabled explicitly through SDK options. It stores config, ETag, timestamp, cache schema version, and scope fingerprints, never raw SDK keys or raw base URLs.

## Cache TTL

Duration used by lazy loading to decide whether a cached config should be refreshed.

## Cached ETag

ETag stored with the cached config and sent on refresh through `If-None-Match`.

## Client Close

`client.close()` stops SDK-owned background polling timers.

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
- Do not include soft-deleted flags or soft-deleted segments.
- Do not generate nondeterministic public config for the same config/environment state.
- Do not silently coerce invalid persisted public arrays to empty arrays.
- Do not change public config shape without updating `docs/CONFIG_FORMAT.md`, SDK parsing, evaluator expectations, and tests in the same change.
- Do not add backward compatibility unless an already-shipped SDK contract requires it.

## Response Shape

- Body contains `projectKey`, `configKey`, `environment`, `revision`, `generatedAt`, `segments`, and `flags`.
- Segment entries contain `conditions` and are keyed by segment key.
- Flag entries contain `type`, `defaultValue`, `rules`, `percentageAttribute`, and `percentageOptions`.
- Advanced targeting conditions, including prerequisites, are emitted inside `rules` without API-side evaluation.
- Config environment state is the source of `revision`, `ETag`, and `generatedAt`.

## Reference: `ai/architecture/public-config-flow.md`

# Public Config Flow Architecture

The public config endpoint serves the SDK-visible JSON contract.

## Endpoint

```txt
GET /public/sdk/:sdkKey/config
```

The path contains the raw SDK key. The API hashes it for lookup.

The private client preview endpoint reuses the same serialization path for a selected `config + environment`, but it is session-authenticated, checks project access, does not require a raw SDK key, and does not update SDK key `lastUsedAt`.

## Flow

1. Hash the raw SDK key.
2. Find an active SDK key with project, config, and environment data.
3. Return not found for missing or revoked SDK keys.
4. Read config environment state for the SDK key's `config + environment`.
5. Compare request `If-None-Match` against current ETag.
6. Return `304 Not Modified` when matched.
7. Load non-deleted feature flag environment values for that config/environment.
8. Load non-deleted segments for that config.
9. Serialize public config with deterministic segment and flag order.
10. Update `lastUsedAt` after valid access.

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
- `segments`
- `flags`

Flag values are local-evaluation data, not evaluated results.

Segments contain reusable local-evaluation conditions. Segment membership is not evaluated by the API.

Advanced targeting data, including prerequisite flag conditions, is serialized inside flag `rules`. The public API never evaluates prerequisites or receives Evaluation Context.

## Reference: `ai/examples/good-public-config-service.md`

# Good Public Config Service

Source: `apps/api/src/public-sdk/public-sdk.service.ts` (sha256: `f15676de9fe6156434999c3f21bb96a4577857ee9a5570d89048858ab07eceb8`)

Why this is canonical:

- Authenticates public config access through hashed SDK keys.
- Reads SDK key, state, and flag values in one transactional path.
- Emits config-scoped segments for local SDK evaluation.
- Preserves ETag and not-modified semantics for SDK cache behavior.
- Uses safe default cache headers for SDK-key URLs while allowing explicit deployment override.
- Records SDK key usage without making telemetry writes break valid config responses.

Canonical public config pattern from `apps/api/src/public-sdk/public-sdk.service.ts`.

```ts
const transactionResult = await this.prisma.$transaction(
  async (tx) => {
    const sdkKey = await tx.sdkKey.findUnique({
      where: { keyHash: hashSdkKey(rawSdkKey) },
      include: {
        project: { select: { id: true, slug: true } },
        config: { select: { id: true, key: true } },
        environment: { select: { id: true, key: true } },
      },
    });

    if (!sdkKey || sdkKey.revokedAt) {
      throw new NotFoundException("SDK key not found");
    }

    const state = await tx.configEnvironmentState.findUnique({
      where: {
        configId_environmentId: {
          configId: sdkKey.configId,
          environmentId: sdkKey.environmentId,
        },
      },
    });
  },
  { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
);
```

The public endpoint authenticates by hashed SDK key and reads config state in the same transaction as flag values.

## ETag Pattern

```ts
if (this.matchesIfNoneMatch(ifNoneMatch, state.etag)) {
  return {
    result: {
      etag: state.etag,
      cacheControl,
      notModified: true,
    },
    sdkKeyId: sdkKey.id,
  };
}
```

Not-modified responses still count as valid SDK config access for `lastUsedAt`.

## Cache-Control And Usage Pattern

```ts
private cacheControlHeader() {
  return process.env.PUBLIC_CONFIG_CACHE_CONTROL ?? "private, no-cache";
}

private async recordSdkKeyUse(sdkKeyId: string) {
  try {
    await this.prisma.sdkKey.updateMany({
      where: { id: sdkKeyId, revokedAt: null },
      data: { lastUsedAt: new Date() },
    });
  } catch {
    return;
  }
}
```

The public endpoint defaults away from shared caching because the raw SDK key is in the URL path, and usage telemetry is best-effort after a valid config read.
