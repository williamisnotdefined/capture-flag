# Public Config Flow Architecture

The public config endpoint serves the SDK-visible JSON contract.

## Endpoint

```txt
GET /public-api/v1/sdk/:sdkKey/config
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
