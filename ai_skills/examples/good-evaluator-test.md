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
