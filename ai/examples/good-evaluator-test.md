# Good Evaluator Test

Source: `packages/evaluator/test/index.spec.ts` (sha256: `1eb6138935c831a9410be992e0ed15e675814be97301d1431e6788983af43bcb`)

Why this is canonical:

- Builds small config fixtures around the public evaluator contract.
- Tests observable evaluation behavior instead of internals.
- Covers fallback, rule order, segment references, rule matching, rollout determinism, and type mismatch behavior.

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
- Segment references evaluate locally and invalid segment references do not match.
- All rule conditions must match.
- Percentage rollout is deterministic.
- Type mismatches return fallback.
