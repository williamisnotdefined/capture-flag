---
applyTo: "packages/react/src/**/*.{ts,tsx},packages/react/test/**/*.{ts,tsx},packages/sdk-js/src/**/*.ts"
---

Generated from `ai/registry.json`. Do not edit manually.

Canonical skill: `../../ai/skills/react-sdk-contract.md`.

Referenced context:
- `../../ai/rules/react-sdk-rules.md`
- `../../ai/rules/sdk-evaluator-rules.md`
- `../../ai/architecture/react-sdk-provider.md`
- `../../ai/architecture/sdk-evaluation-flow.md`
- `../../ai/examples/good-react-sdk-hook.md`

This file is compiled from canonical AI knowledge files. Edit canonical files under `ai`, then run `npm run ai:sync`.

# Compiled AI Skill: react-sdk-contract

## Canonical Skill: `ai/skills/react-sdk-contract.md`

# React SDK Contract

Use this skill when changing `packages/react`, `CaptureFlagProvider`, `useFeatureFlag`, or React SDK tests.

## Goal

Preserve the React SDK as a thin provider/hook layer around the JavaScript SDK client and local evaluation context.

## Read First

- `ai/rules/react-sdk-rules.md`
- `ai/rules/sdk-evaluator-rules.md`
- `ai/architecture/react-sdk-provider.md`
- `ai/architecture/sdk-evaluation-flow.md`
- `ai/examples/good-react-sdk-hook.md`

## Workflow

- Keep the client injected through `CaptureFlagProvider`.
- Keep fallback-first rendering behavior.
- Preserve hook context override semantics.
- Guard async effects against stale updates.
- Preserve the Phase 5 boundary: SDK JS may poll/cache, but React hooks do not subscribe or live-update automatically until Phase 5.1.
- Test through rendered provider/hook behavior with a fake SDK client.

## Expected Output

- React consumers receive fallback immediately and resolved values asynchronously.
- Missing provider usage throws a clear error.
- React SDK remains a thin layer and does not own polling timers or persistent cache.
- No server/API packages are imported into `packages/react`.

## Verification

- Run `npm --workspace @capture-flag/react run test` after React SDK behavior changes.
- Run `npm --workspace @capture-flag/react run build` after package source changes.

# Referenced Context

## Reference: `ai/rules/react-sdk-rules.md`

# React SDK Rules

Rules for `packages/react`, the Capture Flag provider, and `useFeatureFlag`.

## Always

- Keep `CaptureFlagProvider` as the owner of the SDK client and optional default evaluation context.
- Keep `useFeatureFlag(key, fallbackValue, context?)` as the public hook shape unless intentionally changing the React SDK contract.
- Return the fallback value on initial render before async SDK resolution completes.
- Let hook-level context override provider context.
- Cancel stale async updates in effects when dependencies change or components unmount.
- Keep React SDK as a thin layer over an injected JavaScript SDK client.
- Treat polling and cache as SDK JS responsibilities; React does not own timers or persistent cache.
- Until Phase 5.1, SDK polling updates the SDK cache but does not automatically re-render `useFeatureFlag` consumers.
- Test behavior through provider/hook usage, not by reaching into internal context.

## Never

- Do not send evaluation context to the API from the React package.
- Do not make `useFeatureFlag` usable outside `CaptureFlagProvider` silently.
- Do not throw async SDK failures into React consumers when fallback behavior is possible.
- Do not add React-owned polling, suspense, persistent cache, or event subscriptions before product requirements call for them.
- Do not import API/server-only packages into `packages/react`.

## Reference: `ai/rules/sdk-evaluator-rules.md`

# SDK Evaluator Rules

Rules for `packages/sdk-js`, `packages/evaluator`, and `packages/react`.

## Always

- Preserve the SDK shape unless the task explicitly changes it: `createClient(options)` returns `getValue<TValue>(key, fallbackValue, context?)`, `refresh()`, and `close()`.
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
- Keep localStorage cache opt-in and never persist the raw SDK key.
- Keep options minimal and explicit.

## Never

- Do not send evaluation context to the API.
- Do not allow segment evaluation to perform network calls or API lookups.
- Do not import server-only packages into SDK, evaluator, or React SDK packages.
- Do not throw SDK evaluation failures into application code when fallback behavior is possible.
- Do not add retries, custom cache adapters, or event hooks before product requirements call for them.
- Do not add compatibility layers for unshipped config schema versions.

## Evaluation Order

1. Evaluate rules in order, resolving segment reference conditions.
2. Evaluate percentage rollout.
3. Return config `defaultValue`.
4. Return SDK call `fallbackValue` when config is unavailable, invalid, missing, or mismatched.

## Reference: `ai/architecture/react-sdk-provider.md`

# React SDK Provider Architecture

`packages/react` wraps the JavaScript SDK for React applications.

## Provider Boundary

- `CaptureFlagProvider` receives an already-created `CaptureFlagClient`.
- The provider may receive a default evaluation context.
- The package does not create SDK clients, fetch configs directly, or import server-only code.
- Polling, cache, offline mode, and refresh behavior belong to `packages/sdk-js`.
- In Phase 5, SDK polling updates the SDK cache but React hooks do not subscribe or live-update automatically.

## Hook Flow

1. `useFeatureFlag` reads the SDK client and provider context from React context.
2. If no provider exists, it throws a clear usage error.
3. The hook returns the fallback value immediately.
4. An effect asks the SDK client for the resolved value.
5. Hook context overrides provider context when provided.
6. Stale async responses are ignored after dependency changes or unmount.
7. The hook re-evaluates when React dependencies change; SDK cache changes alone do not trigger render until live updates are implemented.

## Testing Boundary

React SDK tests use a fake `CaptureFlagClient` and assert rendered provider/hook behavior.

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

## HTTP Cache Flow

1. The SDK includes `If-None-Match` when the current cache has an ETag.
2. `304 Not Modified` updates cache freshness without parsing or replacing config JSON.
3. Non-OK responses do not replace existing cache.
4. Invalid config responses do not replace existing valid cache.
5. Successful valid responses replace cache and persist it when localStorage is enabled.

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

## Reference: `ai/examples/good-react-sdk-hook.md`

# Good React SDK Hook

Source: `packages/react/src/index.tsx` (sha256: `8d51b9abf1320a47de62a63b7ecd1e1e851b69c9649cf6418a9353a60ea8ad42`)
Source: `packages/react/test/index.spec.tsx` (sha256: `1f433d8dbecb035a02eda81c2773f51ca184940c7ff3c084cbd13be3290b8c97`)

Why this is canonical:

- Keeps React integration around an injected SDK client.
- Returns fallback on initial render and on SDK failure.
- Returns fallback instead of stale resolved values when hook inputs change.
- Lets hook context override provider context without sending context to the API.

## Hook Pattern

```tsx
const effectiveContext = context === undefined ? captureFlag.context : context;
const [state, setState] = useState<FeatureFlagState<TValue>>(() => ({
  client: captureFlag.client,
  context: effectiveContext,
  fallbackValue,
  key,
  value: fallbackValue,
}));

useEffect(() => {
  let cancelled = false;
  const requestState = {
    client: captureFlag.client,
    context: effectiveContext,
    fallbackValue,
    key,
  };

  setState({ ...requestState, value: fallbackValue });
  captureFlag.client.getValue(key, fallbackValue, effectiveContext).then(
    (nextValue) => {
      if (!cancelled) {
        setState({ ...requestState, value: nextValue });
      }
    },
    () => {
      if (!cancelled) {
        setState({ ...requestState, value: fallbackValue });
      }
    },
  );

  return () => {
    cancelled = true;
  };
}, [captureFlag.client, effectiveContext, fallbackValue, key]);

const stateMatchesCurrentRequest =
  state.client === captureFlag.client &&
  state.context === effectiveContext &&
  Object.is(state.fallbackValue, fallbackValue) &&
  state.key === key;

return stateMatchesCurrentRequest ? state.value : fallbackValue;
```

The cancellation guard prevents stale async updates after dependency changes, and the request identity check prevents stale render output before the next effect runs.
