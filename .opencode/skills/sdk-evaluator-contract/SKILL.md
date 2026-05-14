---
name: "sdk-evaluator-contract"
description: "Use when changing SDK, evaluator, fallback, local evaluation, or config consumption behavior."
---

Generated from `ai_skills/registry.json`. Do not edit manually.

Canonical skill: `../../../ai_skills/skills/sdk-evaluator-contract.md`.

Referenced context:
- `../../../ai_skills/glossary/config-sdk-terms.md`
- `../../../ai_skills/rules/sdk-evaluator-rules.md`
- `../../../ai_skills/architecture/sdk-evaluation-flow.md`
- `../../../ai_skills/examples/good-evaluator-test.md`
- `../../../ai_skills/examples/good-sdk-client.md`

This file is compiled from canonical AI knowledge files. Edit canonical files under `ai_skills`, then run `npm run ai-skills:sync`.

# Compiled AI Skill: sdk-evaluator-contract

## Canonical Skill: `ai_skills/skills/sdk-evaluator-contract.md`

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

# Referenced Context

## Reference: `ai_skills/glossary/config-sdk-terms.md`

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

## Reference: `ai_skills/rules/sdk-evaluator-rules.md`

# SDK Evaluator Rules

Rules for `packages/sdk-js`, `packages/evaluator`, and `packages/react`.

## Always

- Preserve the SDK shape unless the task explicitly changes it: `createClient(options).getValue<TValue>(key, fallbackValue): Promise<TValue>`.
- Keep `fallbackValue` distinct from stored config `defaultValue`.
- Fetch public config with the SDK key, then evaluate locally.
- Keep the evaluator pure and deterministic: no network, database, clock, or random dependencies.
- Use deterministic hashing for percentage rollout.
- Return the caller fallback for missing flags, invalid config, unsupported schema versions, type mismatches, and request failures.
- Keep options minimal and explicit.

## Never

- Do not send evaluation context to the API.
- Do not import server-only packages into SDK, evaluator, or React SDK packages.
- Do not throw SDK evaluation failures into application code when fallback behavior is possible.
- Do not add retries, polling, persistent cache, or event hooks before product requirements call for them.
- Do not add compatibility layers for unshipped config schema versions.

## Evaluation Order

1. Evaluate rules in order.
2. Evaluate percentage rollout.
3. Return config `defaultValue`.
4. Return SDK call `fallbackValue` when config is unavailable, invalid, missing, or mismatched.

## Reference: `ai_skills/architecture/sdk-evaluation-flow.md`

# SDK Evaluation Flow Architecture

SDK evaluation is local. The API only serves config data.

## Package Roles

- `packages/evaluator`: pure deterministic evaluation engine.
- `packages/sdk-js`: fetches public config, caches it in memory, and calls the evaluator.
- `packages/react`: React provider and `useFeatureFlag` hook around the JS SDK client.

## SDK Flow

1. App creates a client with `createClient({ baseUrl, sdkKey })`.
2. `getValue(key, fallbackValue, context)` fetches public config if not cached.
3. The SDK validates config shape.
4. The SDK calls `evaluate` from `@capture-flag/evaluator`.
5. Request failures, invalid JSON, unsupported config, missing flags, and type mismatches return fallback.

## Evaluator Flow

1. Validate config shape and `schemaVersion`.
2. Find requested flag.
3. Validate stored default value type.
4. Evaluate rules top-down.
5. Evaluate deterministic percentage rollout.
6. Return config default value.
7. Return caller fallback when evaluation cannot safely produce a typed value.

## Privacy Boundary

Evaluation context stays in the SDK process and is never sent to the public config API.

## Reference: `ai_skills/examples/good-evaluator-test.md`

# Good Evaluator Test

Source: `packages/evaluator/test/index.spec.ts` (sha256: `9c4f0bc7fcea9e81c2c2fc3befe2e0d71609d910ec27076369aa8da9d7a28585`)

Why this is canonical:

- Builds small config fixtures around the public evaluator contract.
- Tests observable evaluation behavior instead of internals.
- Covers fallback, rule order, rule matching, rollout determinism, and type mismatch behavior.

Canonical evaluator test pattern from `packages/evaluator/test/index.spec.ts`.

```ts
function createFlag(overrides: Partial<CaptureFlagConfigFlag> = {}): CaptureFlagConfigFlag {
  return {
    defaultValue: false,
    percentageAttribute: "identifier",
    percentageOptions: [],
    rules: [],
    type: "boolean",
    ...overrides,
  };
}

function createConfig(flag: CaptureFlagConfigFlag = createFlag()): CaptureFlagConfig {
  return {
    configKey: "default",
    environment: "production",
    flags: {
      newCheckout: flag,
    },
    generatedAt: "2026-05-12T00:00:00.000Z",
    projectKey: "ecommerce",
    revision: 1,
    schemaVersion: 1,
  };
}
```

Tests build small config fixtures and assert behavior through the public `evaluate` function.

## Behavior Focus

- Missing or invalid config returns fallback.
- Rules evaluate top-down.
- All rule conditions must match.
- Percentage rollout is deterministic.
- Type mismatches return fallback.

## Reference: `ai_skills/examples/good-sdk-client.md`

# Good SDK Client

Source: `packages/sdk-js/src/index.ts` (sha256: `574aa9ad3e1ea99c041db80b43fc5df2b67e564edc3d8b6188ff160496826104`)

Why this is canonical:

- Keeps config fetching inside the SDK client boundary.
- Delegates evaluation to `@capture-flag/evaluator`.
- Returns caller fallback instead of leaking SDK failures.

Canonical SDK client pattern from `packages/sdk-js/src/index.ts`.

```ts
export function createClient(options: CaptureFlagClientOptions): CaptureFlagClient {
  let cachedConfig: CaptureFlagConfig | null = null;

  async function getConfig(): Promise<CaptureFlagConfig | null> {
    if (cachedConfig) {
      return cachedConfig;
    }

    const response = await fetch(configUrl(options.baseUrl, options.sdkKey));
    if (!response.ok) {
      return null;
    }

    const config = await response.json();
    if (!isCaptureFlagConfig(config)) {
      return null;
    }

    cachedConfig = config;
    return cachedConfig;
  }

  return {
    async getValue(key, fallbackValue, context) {
      try {
        return evaluate({
          config: await getConfig(),
          context,
          fallbackValue,
          flagKey: key,
        });
      } catch {
        return fallbackValue;
      }
    },
  };
}
```

The SDK fetches config with the SDK key, keeps evaluation context local, and degrades to fallback.
