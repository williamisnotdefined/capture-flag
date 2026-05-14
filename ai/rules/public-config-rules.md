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
- Do not change public config shape without updating `docs/CONFIG_FORMAT.md`, SDK parsing, evaluator expectations, and tests in the same change.
- Do not add backward compatibility unless an already-shipped SDK contract requires it.

## Response Shape

- Body contains `projectKey`, `configKey`, `environment`, `revision`, `generatedAt`, `segments`, and `flags`.
- Segment entries contain `conditions` and are keyed by segment key.
- Flag entries contain `type`, `defaultValue`, `rules`, `percentageAttribute`, and `percentageOptions`.
- Config environment state is the source of `revision`, `ETag`, and `generatedAt`.
