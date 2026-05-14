# Feature Flag Domain

Use this skill when changing feature flag or segment behavior in API services, client forms, public config serialization, evaluator logic, or SDK-visible targeting data.

## Goal

Change feature flag, segment, or advanced targeting behavior while preserving type normalization, environment values, prerequisite semantics, revision semantics, public config mapping, and evaluator compatibility.

## Read First

- `ai/glossary/config-sdk-terms.md`
- `ai/rules/feature-flag-domain-rules.md`
- `ai/architecture/feature-flag-lifecycle.md`
- `ai/examples/good-feature-flag-service.md`

## Related References

- Use `client-form-validation` for client feature flag form changes.
- Use `api-public-config-contract` for public config output changes.
- Use `sdk-evaluator-contract` for evaluator or SDK-visible semantics changes.

## Workflow

- Identify whether the change affects API normalization, client forms, public config, evaluator, SDK, or docs.
- Preserve the supported type set unless the task is an explicit contract expansion.
- Keep no-op updates from bumping config revisions or ETags.
- Keep soft-deleted flags out of public config.
- Keep soft-deleted segments out of public config.
- Keep segment updates that affect `segments` in Config JSON tied to revision and ETag bumps.
- Keep prerequisite flag references scoped to active flags in the same config.
- Reject prerequisite self-references and cycles before saving SDK-visible rules.
- Keep advanced targeting operators aligned across API validation, client validation, SDK parsing, evaluator, docs, and tests.
- Update tests across API, evaluator, SDK, or client build according to the touched boundary.

## Expected Output

- Default values and rollout values match flag type.
- Missing environment values use the flag initial default.
- SDK-visible changes bump the correct config environment states.
- Non-SDK-visible metadata changes do not bump public revisions unless intentionally changed.
- Prerequisite flag rename/delete protection prevents dangling SDK-visible references.

## Verification

- Add or update API tests for invalid values, percentage options, prerequisite references, cycles, no-op updates, revision bumps, and missing environment values when changed.
- Run `npm --workspace @capture-flag/api run test` after API feature flag changes.
- Run `npm --workspace @capture-flag/client run build` after client feature flag form changes.
