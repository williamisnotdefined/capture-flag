---
applyTo: "packages/sdk-js/src/**/*.ts,packages/evaluator/src/**/*.ts,packages/react/src/**/*.{ts,tsx},docs/CONFIG_FORMAT.md"
---

Generated from `ai/registry.json`. Do not edit manually.

Canonical skill: `../../ai/skills/sdk-evaluator-contract.md`.

Referenced context:
- `../../ai/glossary/config-sdk-terms.md`
- `../../ai/rules/sdk-evaluator-rules.md`
- `../../ai/architecture/sdk-evaluation-flow.md`
- `../../ai/examples/good-evaluator-test.md`
- `../../ai/examples/good-sdk-client.md`

This file is compiled from canonical AI knowledge files. Edit canonical files under `ai`, then run `npm run ai:sync`.

# Compiled AI Skill: sdk-evaluator-contract

## Canonical Skill: `ai/skills/sdk-evaluator-contract.md`

# SDK Evaluator Contract

Use this skill when changing `packages/sdk-js`, `packages/evaluator`, `packages/react`, evaluation context, local evaluation, SDK cache, polling, refresh, offline behavior, or SDK consumption of public config JSON.

## Goal

Keep SDK consumption and local evaluation predictable, private, typed, and fallback-safe.

## Read First

- `ai/glossary/config-sdk-terms.md`
- `ai/rules/sdk-evaluator-rules.md`
- `ai/architecture/sdk-evaluation-flow.md`
- `ai/examples/good-evaluator-test.md`
- `ai/examples/good-sdk-client.md`

## Related References

- Use `api-public-config-contract` when the public Config JSON shape changes.
- Use `feature-flag-domain` when flag type or rollout semantics change.

## Workflow

- Identify whether the change affects public SDK API, config fetch/cache, SDK modes, polling lifecycle, evaluator semantics, React SDK behavior, or public config parsing.
- Preserve fallback behavior for network failures, missing flags, invalid config, unsupported schema versions, and type mismatches.
- Preserve lazy loading as the default mode and keep `refresh()`/`close()` behavior stable.
- Preserve ETag behavior: send `If-None-Match` with cached ETags and avoid JSON parsing on `304 Not Modified`.
- Preserve valid cache on refresh failure or invalid remote config.
- Preserve SDK subscription semantics: notify only when a valid changed config replaces cache, and never notify for `304`, failed refreshes, invalid configs, or equivalent configs.
- Keep persistent cache opt-in and free of raw SDK keys.
- Keep evaluator logic pure and deterministic.
- Keep evaluation context local to SDK/evaluator code.
- Add behavior tests at the package boundary that changed.

## Expected Output

- Public SDK shape remains stable unless explicitly changed.
- Evaluator behavior follows rules, rollout, default value, then fallback.
- SDK modes remain explicit: `lazy`, `auto`, `manual`, and `offline`.
- Auto polling can be stopped with `client.close()`.
- SDK subscribers can observe cache-changing config updates without receiving evaluation context or cache internals.
- SDK and evaluator packages do not import server-only code.
- New SDK capabilities are driven by product requirements, not speculative overbuild.

## Verification

- Run `npm --workspace @capture-flag/evaluator run test` after evaluator changes.
- Run `npm --workspace @capture-flag/sdk-js run test` after SDK changes.
- Run `npm --workspace @capture-flag/react run test` after React SDK changes.
- Run package builds after public type changes.

# Referenced Context

## Reference: `ai/glossary/config-sdk-terms.md`

# Config And SDK Terms

Terms shared by API, public config, evaluator, SDK, and client UI.

## Feature Flag

SDK-visible setting controlled by Capture Flag. Supported types are `boolean`, `string`, `integer`, and `double`.

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

Browser persistent cache enabled explicitly through SDK options. It stores config, ETag, timestamp, and cache schema version, never the raw SDK key.

## Cache TTL

Duration used by lazy loading to decide whether a cached config should be refreshed.

## Cached ETag

ETag stored with the cached config and sent on refresh through `If-None-Match`.

## Client Close

`client.close()` stops SDK-owned background polling timers.

## Reference: `ai/rules/sdk-evaluator-rules.md`

# SDK Evaluator Rules

Rules for `packages/sdk-js`, `packages/evaluator`, and `packages/react`.

## Always

- Preserve the SDK shape unless the task explicitly changes it: `createClient(options)` returns `getValue<TValue>(key, fallbackValue, context?)`, `refresh()`, `close()`, and `subscribe(listener)`.
- Keep `fallbackValue` distinct from stored config `defaultValue`.
- Fetch public config with the SDK key, then evaluate locally.
- Keep the evaluator pure and deterministic: no network, database, clock, or random dependencies.
- Evaluate segment reference conditions locally from public config `segments` and the Evaluation Context.
- Treat missing, invalid, empty, or nested segment references as non-matches.
- Use deterministic hashing for percentage rollout.
- Return the caller fallback for missing flags, invalid config, unsupported schema versions, type mismatches, and request failures.
- Keep lazy loading as the default SDK mode.
- Keep SDK modes explicit: `lazy`, `auto`, `manual`, and `offline`.
- In lazy mode, respect `cacheTtlMs` before refreshing.
- In auto mode, poll in the SDK client and stop background polling through `client.close()`.
- In manual mode, use the current cache from `getValue` and fetch only through `refresh()`.
- In offline mode, never perform network requests.
- Send `If-None-Match` when a cached ETag exists and treat `304 Not Modified` as a freshness update without reprocessing JSON.
- Preserve an existing valid cache when refresh fails or returns invalid config.
- Notify SDK subscribers only when a valid config with a changed identity replaces the cache.
- Do not notify SDK subscribers for `304 Not Modified`, request failures, non-OK responses, invalid config, or equivalent config responses.
- Keep localStorage cache opt-in and never persist the raw SDK key.
- Keep options minimal and explicit.

## Never

- Do not send evaluation context to the API.
- Do not allow segment evaluation to perform network calls or API lookups.
- Do not import server-only packages into SDK, evaluator, or React SDK packages.
- Do not throw SDK evaluation failures into application code when fallback behavior is possible.
- Do not add retries or custom cache adapters before product requirements call for them.
- Do not add compatibility layers for unshipped config schema versions.

## Evaluation Order

1. Evaluate rules in order, resolving segment reference conditions.
2. Evaluate percentage rollout.
3. Return config `defaultValue`.
4. Return SDK call `fallbackValue` when config is unavailable, invalid, missing, or mismatched.

## Reference: `ai/architecture/sdk-evaluation-flow.md`

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
3. Persistent cache stores config data, ETag, timestamp, and cache schema version, not the raw SDK key.
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
4. Evaluate rules top-down, resolving segment reference conditions locally.
5. Evaluate deterministic percentage rollout.
6. Return config default value.
7. Return caller fallback when evaluation cannot safely produce a typed value.

## Privacy Boundary

Evaluation context stays in the SDK process and is never sent to the public config API.

## Reference: `ai/examples/good-evaluator-test.md`

# Good Evaluator Test

Source: `packages/evaluator/test/index.spec.ts` (sha256: `2fd81290434f74246f5da5284d42aca27c96391f62778b001b7126bb33b7edc5`)

Why this is canonical:

- Builds small config fixtures around the public evaluator contract.
- Tests observable evaluation behavior instead of internals.
- Covers fallback, rule order, segment references, rule matching, rollout determinism, and type mismatch behavior.

Canonical evaluator test pattern from `packages/evaluator/test/index.spec.ts`.

```ts
function createFlag(overrides: Partial<CaptureFlagConfigFlag> = {}): CaptureFlagConfigFlag {
  return {
    defaultValue: false,
    percentageAttribute: "identifier",
    percentageOptions: [],
    rules: [],
    type: "boolean",
    ...overrides,
  };
}

function createConfig(flag: CaptureFlagConfigFlag = createFlag()): CaptureFlagConfig {
  return {
    configKey: "default",
    environment: "production",
    flags: {
      newCheckout: flag,
    },
    generatedAt: "2026-05-12T00:00:00.000Z",
    projectKey: "ecommerce",
    revision: 1,
    schemaVersion: 1,
  };
}
```

Tests build small config fixtures and assert behavior through the public `evaluate` function.

## Behavior Focus

- Missing or invalid config returns fallback.
- Rules evaluate top-down.
- Segment references evaluate locally and invalid segment references do not match.
- All rule conditions must match.
- Percentage rollout is deterministic.
- Type mismatches return fallback.

## Reference: `ai/examples/good-sdk-client.md`

# Good SDK Client

Source: `packages/sdk-js/src/index.ts` (sha256: `e3fa43903832238cc2a78cf2b018028339dabb4c3bf14666b9e86ce90b5a991d`)

Why this is canonical:

- Keeps config fetching and cache behavior inside the SDK client boundary.
- Uses ETag validators without reprocessing `304 Not Modified` responses.
- Supports lazy loading by default while keeping manual, auto polling, and offline modes explicit.
- Preserves valid cache when refresh fails or remote config is invalid.
- Keeps localStorage persistent cache opt-in and free of raw SDK keys.
- Notifies subscribers only when a valid changed config replaces cache.
- Delegates local evaluation to `@capture-flag/evaluator`.
- Returns caller fallback instead of leaking SDK failures.

Canonical SDK client pattern from `packages/sdk-js/src/index.ts`.

```ts
export function createClient(options: CaptureFlagClientOptions): CaptureFlagClient {
  const mode = options.mode ?? "lazy";
  let cacheEntry: CacheEntry | null = readStoredCache(storage, options.localStorageKey);
  const listeners = new Set<CaptureFlagConfigChangeListener>();

  async function getConfig(): Promise<CaptureFlagConfig | null> {
    if (mode === "offline" || mode === "manual") {
      return cacheEntry?.config ?? null;
    }

    if (cacheEntry && (mode === "auto" || !isCacheExpired(cacheEntry, cacheTtlMs))) {
      return cacheEntry.config;
    }

    await refreshConfig();
    return cacheEntry?.config ?? null;
  }

  return {
    async getValue(key, fallbackValue, context) {
      try {
        return evaluate({
          config: await getConfig(),
          context,
          fallbackValue,
          flagKey: key,
        });
      } catch {
        return fallbackValue;
      }
    },
    async refresh() {
      await refreshConfig();
    },
    close() {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    },
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}
```

## Refresh And ETag Pattern

```ts
async function fetchAndUpdateCache(): Promise<void> {
  const response = await fetchConfig(options.baseUrl, options.sdkKey, cacheEntry?.etag ?? null);

  if (response.status === 304) {
    if (cacheEntry) {
      writeCache({ ...cacheEntry, cachedAt: Date.now() });
    }
    return;
  }

  if (!response.ok) {
    return;
  }

  const config = await response.json();
  if (!isCaptureFlagConfig(config)) {
    return;
  }

  replaceCache({
    cachedAt: Date.now(),
    config,
    etag: response.headers.get("etag"),
  });
}
```

The SDK sends `If-None-Match` only when a cached ETag exists, treats `304` as a freshness update, and validates config before replacing cache.

## Subscription Pattern

```ts
function replaceCache(nextEntry: CacheEntry): void {
  const previousEntry = cacheEntry;
  writeCache(nextEntry);

  if (!previousEntry || !cacheEntriesRepresentSameConfig(previousEntry, nextEntry)) {
    notifyConfigChanged();
  }
}

function notifyConfigChanged(): void {
  for (const listener of Array.from(listeners)) {
    try {
      listener();
    } catch {
      // Listener failures must not break SDK polling or cache updates.
    }
  }
}
```

Subscriptions are cache-change notifications only. They do not expose config internals, send evaluation context to the API, or notify for `304`, failed refreshes, invalid configs, or equivalent config responses.

## Persistent Cache Pattern

```ts
const storedValue: StoredCacheEntry = {
  ...entry,
  schemaVersion: CACHE_SCHEMA_VERSION,
};
storage.setItem(key, JSON.stringify(storedValue));
```

Persistent cache is opt-in through `localStorageKey` and stores cache metadata plus config data, not the raw SDK key.

The SDK fetches config with the SDK key, keeps evaluation context local, preserves usable cache on refresh failures, and degrades to fallback when no safe config is available.
