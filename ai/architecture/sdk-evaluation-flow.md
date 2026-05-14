# SDK Evaluation Flow Architecture

SDK evaluation is local. The API only serves config data.

## Package Roles

- `packages/evaluator`: pure deterministic evaluation engine.
- `packages/sdk-js`: fetches public config, caches it in memory, and calls the evaluator.
- `packages/react`: React provider and `useFeatureFlag` hook around the JS SDK client.

## SDK Flow

1. App creates a client with `createClient({ baseUrl, sdkKey })`.
2. `getValue(key, fallbackValue, context)` fetches public config if not cached.
3. The SDK validates config shape.
4. The SDK calls `evaluate` from `@capture-flag/evaluator`.
5. Request failures, invalid JSON, unsupported config, missing flags, and type mismatches return fallback.

## Evaluator Flow

1. Validate config shape and `schemaVersion`.
2. Find requested flag.
3. Validate stored default value type.
4. Evaluate rules top-down.
5. Evaluate deterministic percentage rollout.
6. Return config default value.
7. Return caller fallback when evaluation cannot safely produce a typed value.

## Privacy Boundary

Evaluation context stays in the SDK process and is never sent to the public config API.
