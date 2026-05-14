---
applyTo: "apps/api/src/feature-flags/**/*.ts,apps/api/src/segments/**/*.ts,apps/api/src/common/flag-values.ts,apps/api/src/public-sdk/**/*.ts,apps/client/src/**/*.{ts,tsx},packages/evaluator/src/**/*.ts,packages/sdk-js/src/**/*.ts,docs/CONFIG_FORMAT.md,docs/ROADMAP.md"
---

Generated from `ai/registry.json`. Do not edit manually.

Canonical skill: `../../ai/skills/feature-flag-domain.md`.

Referenced context:
- `../../ai/glossary/config-sdk-terms.md`
- `../../ai/rules/feature-flag-domain-rules.md`
- `../../ai/rules/client-form-rules.md`
- `../../ai/architecture/feature-flag-lifecycle.md`
- `../../ai/examples/good-feature-flag-service.md`

This file is compiled from canonical AI knowledge files. Edit canonical files under `ai`, then run `npm run ai:sync`.

# Compiled AI Skill: feature-flag-domain

## Canonical Skill: `ai/skills/feature-flag-domain.md`

# Feature Flag Domain

Use this skill when changing feature flag or segment behavior in API services, client forms, public config serialization, evaluator logic, or SDK-visible targeting data.

## Goal

Change feature flag, segment, or advanced targeting behavior while preserving type normalization, environment values, prerequisite semantics, revision semantics, public config mapping, and evaluator compatibility.

## Read First

- `ai/glossary/config-sdk-terms.md`
- `ai/rules/feature-flag-domain-rules.md`
- `ai/rules/client-form-rules.md`
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

# Referenced Context

## Reference: `ai/glossary/config-sdk-terms.md`

# Config And SDK Terms

Terms shared by API, public config, evaluator, SDK, and client UI.

## Feature Flag

SDK-visible setting controlled by Capture Flag. Supported types are `boolean`, `string`, `integer`, and `double`.

## Default Value

Configured flag value stored in the database and emitted in Config JSON. This is not the same as SDK fallback value.

## Fallback Value

Value supplied by application code when calling `getValue`. The SDK returns fallback when config is unavailable, invalid, missing, or type-mismatched.

## Rules

Ordered targeting rules emitted as `rules` in public Config JSON. The evaluator checks rules before percentage rollout.

## Segment

Reusable group of attribute conditions scoped to one config and emitted as `segments` in public Config JSON.

## Segment Reference

A rule condition shaped as `{ "segment": "segment-key" }`. It is evaluated locally by checking the referenced segment conditions against the Evaluation Context.

## Prerequisite Flag

A rule condition shaped as `{ "prerequisiteFlag": "flag-key", "operator": "equals", "value": true }`. It evaluates another flag from the same Config JSON locally before deciding whether the current rule matches.

## Advanced Targeting

Targeting features beyond simple attribute equality: prerequisite flags, `arrayContains`, date comparisons, and SemVer comparisons.

## Percentage Rollout

Deterministic distribution of values based on a rollout attribute such as `identifier`.

## Percentage Attribute

Context attribute used for rollout bucketing. Defaults to `identifier`.

## SDK Key

Read-only credential scoped to one config and one environment. Stored as a hash in the API database.

## Raw SDK Key

The full SDK credential shown only immediately after creation. It must never be stored, logged, audited, or re-displayed.

## Key Prefix

Display-safe prefix derived from the raw SDK key and stored for UI identification and audit metadata.

## Config JSON

Versioned public JSON downloaded by SDKs. It contains local-evaluation data, not evaluated flag results.

## React SDK

React provider and hook package that receives a JavaScript SDK client and evaluates flags through that client.

## Config Environment State

Per `config + environment` state that stores revision, ETag, and generated timestamp for public config caching.

## ETag

HTTP cache validator used by SDK clients through `If-None-Match`.

## Lazy Loading

Default SDK mode. The client fetches config only when no cache exists or when the cached entry is older than `cacheTtlMs`.

## Auto Polling

SDK mode where the JavaScript client refreshes config in the background on `pollIntervalMs`.

## Manual Refresh

SDK mode where `getValue` uses the current cache and the application calls `refresh()` to fetch new config.

## Offline Mode

SDK mode where the client uses only existing cache and never performs network requests.

## Memory Cache

Default in-process SDK cache used by every client instance.

## localStorage Cache

Browser persistent cache enabled explicitly through SDK options. It stores config, ETag, timestamp, and cache schema version, never the raw SDK key.

## Cache TTL

Duration used by lazy loading to decide whether a cached config should be refreshed.

## Cached ETag

ETag stored with the cached config and sent on refresh through `If-None-Match`.

## Client Close

`client.close()` stops SDK-owned background polling timers.

## Reference: `ai/rules/feature-flag-domain-rules.md`

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
- Keep date comparison values limited to numeric timestamps or ISO `YYYY-MM-DD`/date-time strings with timezone.
- Keep SemVer comparison values as strict SemVer 2.0.0 strings with `MAJOR.MINOR.PATCH`; ignore build metadata and apply prerelease precedence.
- Validate condition values against their operator shape before saving rules or segment conditions.
- Keep segment `conditionsJson` as attribute conditions only; segment nesting remains unsupported.
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

## Reference: `ai/rules/client-form-rules.md`

# Client Form Rules

Rules for forms in `apps/client`.

## Always

- Use `react-hook-form` for client form state and submission.
- Use `zod` for form schemas.
- Connect schemas with `zodResolver` from `@hookform/resolvers/zod`.
- Use `defaultValues` for every registered field.
- Use `noValidate` on forms so Zod owns validation messages.
- Keep schemas close to the form unless reused by multiple forms.
- Trim string values before sending them to API mutations.
- Omit optional empty string values from mutation payloads instead of sending `""`.
- Use `aria-invalid` on invalid fields.
- Display field errors next to the field that owns them.

## Never

- Do not parse `FormData` manually in React components when the form is owned by React.
- Do not rely on browser `required` validation for app-level messages.
- Do not keep server errors in React Hook Form field state unless they map to a specific field.
- Do not duplicate parsing, schema, and payload normalization across features when a colocated helper is clearer.
- Do not send empty optional metadata fields when creating flags.

## Boundaries

- React Hook Form owns field state and field validation.
- Zod owns client-side parsing and validation messages.
- React Query mutation hooks own API calls and cache invalidation.
- Server errors should remain visible from mutation state unless mapped intentionally.

## Reference: `ai/architecture/feature-flag-lifecycle.md`

# Feature Flag Lifecycle Architecture

Feature flags are edited through private API services and consumed through public config JSON.

## Creation Flow

1. Resolve config by `configId`.
2. Require project write role for the config project.
3. Normalize key, name, type, default value, tags, hint, and owner.
4. Create the feature flag.
5. Create one environment value for every existing project environment.
6. Bump each affected config environment state.
7. Write an audit log entry.

## Metadata Update Flow

1. Find the active flag by ID.
2. Require project write role.
3. Normalize received fields.
4. If no fields are received, reject the request.
5. If normalized values do not change data, return the existing flag.
6. If SDK-visible metadata changes, bump affected config environment states.
7. Write an audit log entry.

## Environment Value Update Flow

1. Find the active flag by ID.
2. Require project write role.
3. Verify the target environment belongs to the flag project.
4. Normalize public value fields for the flag type.
5. Reject updates with no public value fields.
6. If the update is a no-op, return the existing value without bumping revision or audit.
7. Upsert the environment value.
8. Bump the matching config environment state.
9. Write an audit log entry.

## Deletion Flow

Feature flag deletion is soft delete through `deletedAt`. Deletion bumps affected config environment states and public config excludes the flag.

## Segment Flow

Segments are created, updated, and soft-deleted through private API routes scoped by config. Creating or deleting a segment changes the public Config JSON for every environment of that config. Updating `key` or `conditionsJson` also bumps every config environment state for the config; updating only UI metadata such as `name` or `description` does not bump public revisions. Segment rename and deletion are rejected while active flag rules still reference the segment key.

## Advanced Targeting Flow

Advanced targeting lives inside `rulesJson` on feature flag environment values. Updating rules normalizes attribute conditions, segment references, and prerequisite flag references before the environment value is saved. Date comparisons accept numeric timestamps or ISO date strings, and SemVer comparisons use strict SemVer 2.0.0 strings. Prerequisite references must point to active flags in the same config, may use only `equals` or `notEquals`, must use a value matching the referenced flag type, and cannot reference the current flag. The API rejects prerequisite cycles for the target environment. Flag rename and deletion are rejected while active rules still reference that flag key as a prerequisite.

## Reference: `ai/examples/good-feature-flag-service.md`

# Good Feature Flag Service

Source: `apps/api/src/feature-flags/feature-flags.service.ts` (sha256: `cd361eb758cf746c4f138af469ef69511b39623ea2d7ddcc9ae58d45dfb1f39f`)

Why this is canonical:

- Initializes SDK-visible values for every existing environment.
- Keeps feature flag creation and environment values in one transaction.
- Avoids revision, ETag, and audit churn for no-op public value updates.
- Validates prerequisite flag references before saving SDK-visible rules.

Canonical feature flag service patterns from `apps/api/src/feature-flags/feature-flags.service.ts`.

## Creation Pattern

```ts
const defaultValue = normalizeFlagDefaultValue(
  type,
  input.defaultValue === undefined ? defaultValueForFlagType(type) : input.defaultValue,
);

return this.prisma.$transaction(async (tx) => {
  const flag = await tx.featureFlag.create({
    data: {
      projectId: config.projectId,
      configId,
      key,
      name,
      initialDefaultValue: defaultValue as Prisma.InputJsonValue,
      tags,
      ownerUserId,
    },
  });

  const environments = await tx.environment.findMany({
    where: { projectId: config.projectId },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });

  await tx.featureFlagEnvironmentValue.createMany({
    data: environments.map((environment) => ({
      projectId: config.projectId,
      configId,
      featureFlagId: flag.id,
      environmentId: environment.id,
      defaultValue: defaultValue as Prisma.InputJsonValue,
      rulesJson: [] as Prisma.InputJsonValue,
      percentageAttribute: "identifier",
      percentageOptionsJson: [] as Prisma.InputJsonValue,
      updatedByUserId: userId,
    })),
  });
});
```

Creation initializes every existing environment with SDK-visible values.

## No-Op Value Update Pattern

```ts
if (existingValue && !this.hasPublicValueChange(existingValue, publicUpdate)) {
  return existingValue;
}
```

No-op public value updates must not bump revision, ETag, or audit.
