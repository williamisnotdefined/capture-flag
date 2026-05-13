# API Public Config Contract

Use this skill when changing the public SDK config endpoint, SDK key lookup, ETags, cache behavior, config revisioning, or public flag serialization.

## Contract

- Public endpoint: `GET /public/sdk/:sdkKey/config`.
- The raw SDK key is a credential. Look it up by hash and do not store or log it in plaintext.
- Missing or revoked SDK keys return not found without exposing whether the key ever existed.
- The response body uses `schemaVersion: 1` until an explicit versioned contract change is made.
- The body contains `projectKey`, `configKey`, `environment`, `revision`, `generatedAt`, and `flags`.
- Flag entries contain `type`, `defaultValue`, `rules`, `percentageAttribute`, and `percentageOptions`.
- User targeting context is not sent to this API; SDKs evaluate locally from the downloaded config.

## HTTP Caching

- Always set `ETag` and `Cache-Control` on successful public config responses.
- Support `If-None-Match`, including weak ETags, comma-separated values, and `*`.
- Return `304 Not Modified` with no body when the client ETag matches.
- Keep `PUBLIC_CONFIG_CACHE_CONTROL` as the environment override and `public, no-cache` as the fallback unless intentionally changed.
- Update `lastUsedAt` after valid SDK config access, including not-modified responses.

## Consistency

- Read SDK key, config state, and flag values in a transaction so the config body matches the revision and ETag.
- Keep public config generation deterministic for the same config/environment state.
- Exclude soft-deleted flags.
- Use config environment state as the source of revision, ETag, and `generatedAt`.
- Bump config environment state only when SDK-visible data changes.

## Versioning

- If `schemaVersion` changes, update `docs/CONFIG_FORMAT.md`, SDK parsing, evaluator expectations, and tests in the same change.
- Add backward compatibility only when an already-shipped SDK contract requires it.

## Verification

- Update `apps/api/test/public-sdk.service.spec.ts` or equivalent tests for contract changes.
- Test 200 and 304 paths when ETag behavior changes.
- Run `npm --workspace @capture-flag/api run test` after public config changes.
- Run SDK/evaluator tests when public config shape changes.
