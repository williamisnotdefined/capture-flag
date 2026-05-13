# SDK Evaluator Contract

Use this skill when changing `packages/sdk-js`, `packages/evaluator`, evaluation context, local evaluation, or SDK consumption of public config JSON.

## Rules

- Preserve the public SDK shape unless the task explicitly changes it: `createClient(options).getValue<TValue>(key, fallbackValue): Promise<TValue>`.
- Keep `fallbackValue` distinct from stored config `defaultValue`. Fallback is supplied by the application for unavailable, missing, invalid, or errored evaluation.
- SDKs fetch public config with the SDK key, but evaluation should happen locally.
- Do not send user evaluation context to the API for flag evaluation.
- The evaluator should be pure and deterministic: no network, database, clock, or random dependencies in evaluation logic.
- Percentage rollout must use deterministic hashing when implemented.
- Do not overbuild SDK or evaluator behavior before the task targets that phase.

## Evaluation Semantics

- Expected order: rules, then percentage rollout, then config `defaultValue`, then SDK call `fallbackValue` when config is unavailable or invalid.
- Missing flags return the caller's fallback value.
- Type mismatches return the caller's fallback value rather than throwing into application code.
- Unsupported `schemaVersion` returns fallback unless a compatibility layer is intentionally added.
- Support `boolean`, `string`, `integer`, and `double` consistently with API normalization.

## SDK Boundaries

- The SDK may cache downloaded config and use ETags for refreshes.
- Network failures, 401/404-like responses, invalid JSON, and unsupported config versions should degrade to fallback behavior.
- Keep options minimal and explicit. Add retries, polling, or event hooks only when product requirements call for them.
- Avoid importing server-only packages into SDK or evaluator packages.

## Verification

- Add evaluator unit tests for evaluation order, missing flags, type mismatches, percentage rollout, and fallback behavior as those features are implemented.
- Add SDK tests for fetch/cache/error boundaries when SDK networking is implemented.
- Run `npm --workspace @capture-flag/evaluator run test` and `npm --workspace @capture-flag/sdk-js run test` after changes.
- Run both package builds after public type changes.
