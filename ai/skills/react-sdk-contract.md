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
- Subscribe to SDK config changes through the injected client and clean up subscriptions on dependency changes or unmount.
- Test through rendered provider/hook behavior with a fake SDK client.

## Expected Output

- React consumers receive fallback immediately and resolved values asynchronously.
- React consumers re-render after SDK config-change notifications.
- Missing provider usage throws a clear error.
- React SDK remains a thin layer and does not own polling timers or persistent cache.
- No server/API packages are imported into `packages/react`.

## Verification

- Run `npm --workspace @capture-flag/react run test` after React SDK behavior changes.
- Run `npm --workspace @capture-flag/react run build` after package source changes.
