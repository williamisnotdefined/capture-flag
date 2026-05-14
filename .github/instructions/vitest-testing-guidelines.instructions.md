---
applyTo: "**/*.{test,spec}.{ts,tsx}"
---

Generated from `ai/registry.json`. Do not edit manually.

Canonical skill: `../../ai/skills/vitest-testing-guidelines.md`.

Referenced context:
- `../../ai/rules/testing-rules.md`
- `../../ai/architecture/monorepo.md`
- `../../ai/examples/good-evaluator-test.md`
- `../../ai/examples/good-public-config-service.md`

This file is compiled from canonical AI knowledge files. Edit canonical files under `ai`, then run `npm run ai:sync`.

# Compiled AI Skill: vitest-testing-guidelines

## Canonical Skill: `ai/skills/vitest-testing-guidelines.md`

# Vitest Testing Guidelines

Use this skill when adding or changing tests in this Vitest-based monorepo.

## Goal

Add focused tests that protect observable behavior and domain invariants without coupling to implementation details.

## Read First

- `ai/rules/testing-rules.md`
- `ai/architecture/monorepo.md`
- `ai/examples/good-evaluator-test.md`
- `ai/examples/good-public-config-service.md`

## Workflow

- Identify the behavior being protected and the narrowest workspace test suite.
- Reuse nearby test setup patterns before adding helpers or dependencies.
- For API service tests, mock only the Prisma methods and collaborators the test exercises.
- For evaluator and SDK tests, assert public behavior through package exports.
- For client changes without an existing harness, prefer build verification and document the remaining manual behavior.

## Expected Output

- Regression tests cover bug fixes.
- Domain tests cover role gates, tenant boundaries, revision bumps, SDK key secrecy, config serialization, fallback behavior, or evaluation order when those paths change.
- No `.only` remains.

## Verification

- Run the targeted test file first when one exists.
- Run the affected workspace test command after the targeted test passes.
- State blockers clearly if tests cannot run because of missing services or dependencies.

# Referenced Context

## Reference: `ai/rules/testing-rules.md`

# Testing Rules

Testing rules for this Vitest-based monorepo.

## Always

- Use Vitest APIs such as `describe`, `it`, `expect`, `vi.fn`, and `vi.spyOn`.
- Add regression tests next to changed behavior when fixing bugs.
- Test observable behavior and domain invariants instead of implementation details.
- Run a targeted test first when a specific test file exists.
- Run the affected workspace test command after targeted tests pass.
- For API tests, mock Prisma and collaborators with plain objects containing only exercised `vi.fn()` methods.
- For SDK and evaluator packages, prefer pure unit tests around evaluation order, fallback behavior, type handling, and request/cache boundaries.

## Never

- Do not use Jest-only APIs or `jest.mock` patterns.
- Do not leave `.only` in tests.
- Do not introduce coverage targets unless a coverage script exists or the task explicitly asks for coverage.
- Do not assume Testing Library is available in `apps/client`; add new test dependencies only when the task justifies them.
- Do not reach for a real database in API unit tests by default.

## Verification

- API tests: `npm --workspace @capture-flag/api run test`.
- Client tests: `npm --workspace @capture-flag/client run test`.
- Shared tests: `npm --workspace @capture-flag/shared run test`.
- Evaluator tests: `npm --workspace @capture-flag/evaluator run test`.
- SDK tests: `npm --workspace @capture-flag/sdk-js run test`.
- All workspace tests: `npm run test`.

## Reference: `ai/architecture/monorepo.md`

# Monorepo Architecture

Capture Flag is a TypeScript npm workspaces monorepo.

## Workspaces

- `apps/api`: NestJS API, Prisma access, authentication, tenant services, public SDK config endpoint.
- `apps/client`: Vite React app for platform UI.
- `packages/shared`: shared package boundary for reusable cross-workspace code.
- `packages/evaluator`: pure local evaluation engine.
- `packages/sdk-js`: JavaScript SDK that fetches public config and evaluates locally.
- `packages/react`: React provider and hook around the JavaScript SDK.

## Root Commands

- Build all workspaces: `npm run build`.
- Test all workspaces: `npm run test`.
- Lint repository: `npm run lint`.
- Sync AI routes: `npm run ai:sync`.
- Check AI routes: `npm run ai:check`.

## Boundaries

- API-only code stays in `apps/api`.
- Client-only code stays in `apps/client`.
- SDK and evaluator code must not import server-only packages.
- Shared code belongs in `packages/*` only when there is a real cross-workspace consumer.
- Product and contract docs in `docs/*` are part of the source of truth for behavior.

## Reference: `ai/examples/good-evaluator-test.md`

# Good Evaluator Test

Source: `packages/evaluator/test/index.spec.ts` (sha256: `f0770cfaff8641996ddbc820920f11557e072ba47afe8e81423325840978c17e`)

Why this is canonical:

- Builds small config fixtures around the public evaluator contract.
- Tests observable evaluation behavior instead of internals.
- Covers fallback, rule order, segment references, prerequisite flags, advanced operators, rollout determinism, and type mismatch behavior.

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
- Prerequisite flags evaluate locally and cycles do not match.
- Advanced operators cover arrays, dates, and SemVer precedence.
- All rule conditions must match.
- Percentage rollout is deterministic.
- Type mismatches return fallback.

## Reference: `ai/examples/good-public-config-service.md`

# Good Public Config Service

Source: `apps/api/src/public-sdk/public-sdk.service.ts` (sha256: `99996ed36ffd893b7920ba52bd06016f142dc2742c9942dce4d0887c36bf1156`)

Why this is canonical:

- Authenticates public config access through hashed SDK keys.
- Reads SDK key, state, and flag values in one transactional path.
- Emits config-scoped segments for local SDK evaluation.
- Preserves ETag and not-modified semantics for SDK cache behavior.
- Uses safe default cache headers for SDK-key URLs while allowing explicit deployment override.
- Records SDK key usage without making telemetry writes break valid config responses.

Canonical public config pattern from `apps/api/src/public-sdk/public-sdk.service.ts`.

```ts
const transactionResult = await this.prisma.$transaction(
  async (tx) => {
    const sdkKey = await tx.sdkKey.findUnique({
      where: { keyHash: hashSdkKey(rawSdkKey) },
      include: {
        project: { select: { id: true, slug: true } },
        config: { select: { id: true, key: true } },
        environment: { select: { id: true, key: true } },
      },
    });

    if (!sdkKey || sdkKey.revokedAt) {
      throw new NotFoundException("SDK key not found");
    }

    const state = await tx.configEnvironmentState.findUnique({
      where: {
        configId_environmentId: {
          configId: sdkKey.configId,
          environmentId: sdkKey.environmentId,
        },
      },
    });
  },
  { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
);
```

The public endpoint authenticates by hashed SDK key and reads config state in the same transaction as flag values.

## ETag Pattern

```ts
if (this.matchesIfNoneMatch(ifNoneMatch, state.etag)) {
  return {
    result: {
      etag: state.etag,
      cacheControl,
      notModified: true,
    },
    sdkKeyId: sdkKey.id,
  };
}
```

Not-modified responses still count as valid SDK config access for `lastUsedAt`.

## Cache-Control And Usage Pattern

```ts
private cacheControlHeader() {
  return process.env.PUBLIC_CONFIG_CACHE_CONTROL ?? "private, no-cache";
}

private async recordSdkKeyUse(sdkKeyId: string) {
  try {
    await this.prisma.sdkKey.updateMany({
      where: { id: sdkKeyId, revokedAt: null },
      data: { lastUsedAt: new Date() },
    });
  } catch {
    return;
  }
}
```

The public endpoint defaults away from shared caching because the raw SDK key is in the URL path, and usage telemetry is best-effort after a valid config read.
