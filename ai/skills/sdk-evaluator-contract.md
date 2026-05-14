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
- Preserve fallback-safe local behavior for advanced targeting: missing attributes, invalid segments, missing prerequisites, invalid prerequisite values, and prerequisite cycles should not throw into app code.
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
- Prerequisite flags are evaluated locally from the same Config JSON and never trigger network or API calls.
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
