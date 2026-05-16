# Vitest Testing Guidelines

Use this skill when adding or changing tests in this Vitest-based monorepo.

## Goal

Add focused tests that protect observable behavior and domain invariants without coupling to implementation details.

## Read First

- `ai/rules/testing-rules.md`
- `ai/architecture/monorepo.md`
- `ai/architecture/client-app.md`
- `ai/examples/good-evaluator-test.md`
- `ai/examples/good-public-config-service.md`

## Workflow

- Identify the behavior being protected and the narrowest workspace test suite.
- Reuse nearby test setup patterns before adding helpers or dependencies.
- For `apps/client`, place tests in the owning `__tests__/` folder described by the client architecture and use existing Testing Library/React Query test helpers.
- For `apps/client` API operations and hooks, test both successful mocked responses and mocked API error responses.
- For API service tests, mock only the Prisma methods and collaborators the test exercises.
- For evaluator and SDK tests, assert public behavior through package exports.
- For client coverage changes, run the coverage script and keep configured thresholds at 90% or higher unless the user explicitly narrows scope.

## Expected Output

- Regression tests cover bug fixes.
- Client tests follow the current `__tests__/` folder layout instead of loose sibling `*.test.ts(x)` files.
- Client request functions and React Query hooks cover success, error, enabled state, and cache invalidation where applicable.
- Domain tests cover role gates, tenant boundaries, revision bumps, SDK key secrecy, config serialization, fallback behavior, or evaluation order when those paths change.
- No `.only` remains.

## Verification

- Run the targeted test file first when one exists.
- Run the affected workspace test command after the targeted test passes.
- Run `npm --workspace @capture-flag/client run test:coverage` after changing client coverage configuration or broad client tests.
- State blockers clearly if tests cannot run because of missing services or dependencies.
