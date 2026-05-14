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
