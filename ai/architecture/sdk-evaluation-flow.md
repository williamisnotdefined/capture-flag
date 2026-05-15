# SDK Evaluation Flow Architecture

SDK evaluation is local. The API only serves config data.

## Package Roles

- `packages/evaluator`: pure deterministic evaluation engine.
- `packages/sdk-js`: fetches public config, owns cache/polling behavior, and calls the evaluator.
- `packages/react`: React provider and `useFeatureFlag` hook around the JS SDK client.

## SDK Flow

1. App creates a client with `createClient({ baseUrl, sdkKey })`.
2. The default mode is `lazy`.
3. `getValue(key, fallbackValue, context)` resolves a config according to the selected SDK mode.
4. The SDK validates config shape before replacing cache.
5. The SDK calls `evaluate` from `@capture-flag/evaluator`.
6. Request failures, invalid JSON, unsupported config, missing flags, and type mismatches return fallback.

## Cache And Refresh Flow

1. Memory cache is always the in-process source of truth.
2. `localStorage` cache is browser-only and opt-in through SDK options.
3. Persistent cache stores config data, ETag, timestamp, cache schema version, and scope fingerprints, not raw SDK keys or raw base URLs.
4. Lazy mode fetches when no cache exists or `cacheTtlMs` has expired.
5. Manual mode returns current cache from `getValue`; applications call `refresh()` to fetch.
6. Offline mode returns current cache only and never performs network requests.
7. Auto mode reuses cache from `getValue` and refreshes in the background on `pollIntervalMs`.
8. `close()` stops auto polling timers.
9. Concurrent refresh calls share the same in-flight refresh promise.
10. SDK subscriptions observe valid config changes without exposing cache internals.

## HTTP Cache Flow

1. The SDK includes `If-None-Match` when the current cache has an ETag.
2. `304 Not Modified` updates cache freshness without parsing or replacing config JSON.
3. Non-OK responses do not replace existing cache.
4. Invalid config responses do not replace existing valid cache.
5. Successful valid responses replace cache and persist it when localStorage is enabled.
6. Subscribers are notified only when the accepted config identity changes.
7. Subscribers are not notified for `304`, failed refreshes, invalid configs, or equivalent config responses.

## Evaluator Flow

1. Validate config shape and `schemaVersion`.
2. Find requested flag.
3. Validate stored default value type.
4. Evaluate rules top-down, resolving segment reference and prerequisite flag conditions locally.
5. Treat missing attributes, invalid segment references, missing prerequisites, invalid prerequisite values, and prerequisite cycles as non-matches.
6. Evaluate deterministic percentage rollout.
7. Return config default value.
8. Return caller fallback when evaluation cannot safely produce a typed value.

## Privacy Boundary

Evaluation context stays in the SDK process and is never sent to the public config API.
