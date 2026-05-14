# React SDK Contract

Use this skill when changing `packages/react`, `CaptureFlagProvider`, `useFeatureFlag`, or React SDK tests.

## Goal

Preserve the React SDK as a thin provider/hook layer around the JavaScript SDK client and local evaluation context.

## Read First

- `ai_skills/rules/react-sdk-rules.md`
- `ai_skills/rules/sdk-evaluator-rules.md`
- `ai_skills/architecture/react-sdk-provider.md`
- `ai_skills/architecture/sdk-evaluation-flow.md`
- `ai_skills/examples/good-react-sdk-hook.md`

## Workflow

- Keep the client injected through `CaptureFlagProvider`.
- Keep fallback-first rendering behavior.
- Preserve hook context override semantics.
- Guard async effects against stale updates.
- Test through rendered provider/hook behavior with a fake SDK client.

## Expected Output

- React consumers receive fallback immediately and resolved values asynchronously.
- Missing provider usage throws a clear error.
- No server/API packages are imported into `packages/react`.

## Verification

- Run `npm --workspace @capture-flag/react run test` after React SDK behavior changes.
- Run `npm --workspace @capture-flag/react run build` after package source changes.
