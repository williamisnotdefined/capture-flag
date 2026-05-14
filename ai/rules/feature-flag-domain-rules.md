# Feature Flag Domain Rules

Rules for feature flag types, values, revisions, and SDK-visible data.

## Always

- Support only `boolean`, `string`, `integer`, and `double` flag types.
- Require flag keys to start with a letter and contain only letters, numbers, dots, underscores, or hyphens.
- Ensure default values match the flag type.
- Treat `rulesJson` and `percentageOptionsJson` as JSON arrays.
- Allow targeting rules to reference reusable segments with `{ "segment": "segment-key" }` conditions.
- Allow targeting rules to reference prerequisite flags with `{ "prerequisiteFlag": "flag-key", "operator": "equals", "value": true }` conditions.
- Restrict prerequisite flag operators to `equals` and `notEquals` until a product requirement expands them.
- Require prerequisite flag references to point to active flags in the same config and reject self-references.
- Reject prerequisite cycles when saving environment rules and keep evaluator cycle handling fallback-safe.
- Support advanced attribute operators: `arrayContains`, `dateBefore`, `dateAfter`, `semverEquals`, `semverGreaterThan`, `semverGreaterThanOrEquals`, `semverLessThan`, and `semverLessThanOrEquals`.
- Validate condition values against their operator shape before saving rules or segment conditions.
- Keep segment `conditionsJson` as attribute conditions only; segment nesting is outside Fase 6.
- Keep segment `conditionsJson` free of prerequisite flag references.
- Prevent segment rename or deletion while active flag rules still reference that segment key.
- Prevent flag rename or deletion while active flag rules still reference that flag key as a prerequisite.
- Require non-empty percentage options to contain objects with `percentage` and `value`, match the flag type, and total 100.
- Default `percentageAttribute` to `identifier`.
- Normalize tags by trimming, dropping empty values, and deduplicating.
- Create one environment value row for every existing project environment when creating a flag.
- Use the flag initial default when creating a missing environment value later.
- Bump config environment state only when SDK-visible data changes.

## Never

- Do not add unsupported flag types without updating API normalization, client validation, public config, evaluator, SDK, docs, and tests together.
- Do not bump revisions or ETags for no-op updates.
- Do not bump revisions for metadata that is not emitted in public config unless that behavior changes intentionally.
- Do not return soft-deleted flags in public config.
- Do not return soft-deleted segments in public config.
- Do not allow segment changes that affect public config without bumping every environment state for that config.
- Do not allow prerequisite changes that affect public config without bumping the matching config environment state.
- Do not represent boolean flags with a separate `enabled` field.
- Do not send empty optional metadata fields from client forms when creating flags.

## Public Mapping

- `FeatureFlagEnvironmentValue.defaultValue` maps to public `defaultValue`.
- `rulesJson` maps to public `rules`.
- `percentageOptionsJson` maps to public `percentageOptions`.
- `Segment.conditionsJson` maps to public `segments[segment.key].conditions`.
- Prerequisite conditions map through public `rules` unchanged and are evaluated by the SDK/evaluator.
- Public flag order must stay stable and deterministic.
