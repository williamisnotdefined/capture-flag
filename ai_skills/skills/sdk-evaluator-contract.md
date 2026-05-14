# SDK Evaluator Contract

Use this skill when changing `packages/sdk-js`, `packages/evaluator`, `packages/react`, evaluation context, local evaluation, or SDK consumption of public config JSON.

## Goal

Keep SDK consumption and local evaluation predictable, private, typed, and fallback-safe.

## Read First

- `ai_skills/glossary/config-sdk-terms.md`
- `ai_skills/rules/sdk-evaluator-rules.md`
- `ai_skills/architecture/sdk-evaluation-flow.md`
- `ai_skills/examples/good-evaluator-test.md`
- `ai_skills/examples/good-sdk-client.md`

## Related References

- Use `api-public-config-contract` when the public Config JSON shape changes.
- Use `feature-flag-domain` when flag type or rollout semantics change.

## Workflow

- Identify whether the change affects public SDK API, config fetch/cache, evaluator semantics, React SDK behavior, or public config parsing.
- Preserve fallback behavior for network failures, missing flags, invalid config, unsupported schema versions, and type mismatches.
- Keep evaluator logic pure and deterministic.
- Keep evaluation context local to SDK/evaluator code.
- Add behavior tests at the package boundary that changed.

## Expected Output

- Public SDK shape remains stable unless explicitly changed.
- Evaluator behavior follows rules, rollout, default value, then fallback.
- SDK and evaluator packages do not import server-only code.
- New SDK capabilities are driven by product requirements, not speculative overbuild.

## Verification

- Run `npm --workspace @capture-flag/evaluator run test` after evaluator changes.
- Run `npm --workspace @capture-flag/sdk-js run test` after SDK changes.
- Run `npm --workspace @capture-flag/react run test` after React SDK changes.
- Run package builds after public type changes.
