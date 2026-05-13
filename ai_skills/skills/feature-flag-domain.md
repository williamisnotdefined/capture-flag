# Feature Flag Domain

Use this skill when changing feature flag behavior in API services, client forms, public config serialization, evaluator logic, or SDK-visible flag data.

## Rules

- Supported flag types are `boolean`, `string`, `integer`, and `double`.
- Flag keys must start with a letter and contain only letters, numbers, dots, underscores, or hyphens.
- Default values must match the flag type.
- `rulesJson` and `percentageOptionsJson` must be JSON arrays.
- Percentage options must contain objects with `percentage` and `value` and must total 100 when present.
- Percentage option values must match the flag type.
- `percentageAttribute` defaults to `identifier`.
- Tags are normalized by trimming, dropping empty values, and deduplicating.

## Environment Values

- Creating a flag creates a value row for every existing environment in the project.
- Missing environment values should use the flag's initial default value when created later.
- Updating a flag environment value bumps the matching config environment state only when SDK-visible data changed.
- No-op updates must not bump config revisions or ETags.
- Deleting a flag soft-deletes it and bumps each affected config environment state.
- Changing a flag key is public-contract changing and must bump affected config environment states.
- Changing metadata that is not emitted in public config should not bump revisions unless that behavior changes intentionally.

## Public Config Mapping

- `FeatureFlagEnvironmentValue.defaultValue` maps to public `defaultValue`.
- `rulesJson` maps to public `rules`.
- `percentageOptionsJson` maps to public `percentageOptions`.
- Public config must exclude soft-deleted flags.
- Public flag order should stay stable and deterministic.

## Client Guidance

- Parse boolean, string, integer, and double form values before mutation calls.
- Validate JSON text fields before sending arrays to the API.
- Validate percentage rollout JSON before mutation calls: it must be an array of objects with `percentage` and `value`, values must match the flag type, and non-empty options must total 100.
- Validate normalized tags before mutation calls: trim, drop empty values, deduplicate, allow at most 20 tags, and keep every tag at or below 50 characters.
- Omit empty optional metadata fields when creating flags; send `null` only where the API uses it to clear a value.
- Keep React Hook Form and Zod validation consistent with API constraints.

## Verification

- Add or update API tests for invalid default values, percentage options, no-op updates, revision bumps, and missing environment values when those behaviors change.
- Run `npm --workspace @capture-flag/api run test` after API feature flag changes.
- Run `npm --workspace @capture-flag/client run build` after client feature flag form changes.
