# API Public Config Contract

Use this skill when changing the public SDK config endpoint, SDK key lookup, ETags, cache behavior, config revisioning, or public flag serialization.

## Goal

Preserve the SDK-visible Config JSON contract and HTTP cache semantics while keeping evaluation local to SDKs.

## Read First

- `ai/glossary/config-sdk-terms.md`
- `ai/rules/public-config-rules.md`
- `ai/architecture/public-config-flow.md`
- `ai/examples/good-public-config-service.md`

## External Docs

- `docs/CONFIG_FORMAT.md`

## Workflow

- Identify whether the change affects SDK key lookup, ETags, cache headers, revision state, public body shape, or flag serialization.
- Keep SDK key lookup hashed and public routes session-free.
- Keep default cache headers safe for SDK-key URLs; shared cache behavior must be explicit.
- Keep reads transactionally consistent with config environment state.
- Update public config tests for 200 and 304 paths when cache behavior changes.
- Update SDK/evaluator parsing and tests when public config shape changes.

## Expected Output

- Public config remains deterministic for the same config/environment state.
- User evaluation context is not sent to the API.
- Soft-deleted flags are excluded.
- `lastUsedAt` updates after valid SDK access, including not-modified responses, without making telemetry writes break valid responses.

## Verification

- Update `apps/api/test/public-sdk.service.spec.ts` or equivalent tests for contract changes.
- Run `npm --workspace @capture-flag/api run test` after public config changes.
- Run SDK/evaluator tests when public config shape changes.
