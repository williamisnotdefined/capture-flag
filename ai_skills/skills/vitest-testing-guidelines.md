# Vitest Testing Guidelines

Use this skill when adding or changing tests in this Vitest-based monorepo.

## Rules

- Use Vitest APIs such as `describe`, `it`, `expect`, `vi.fn`, and `vi.spyOn`.
- Do not use Jest-only APIs or `jest.mock` patterns.
- Prefer targeted test runs while developing, then run the affected workspace test command before finishing.
- Add regression tests next to the behavior being changed when fixing bugs.
- Keep tests focused on observable behavior and domain invariants, not implementation details.
- Use `.only` only as a temporary local development aid. Remove all `.only` before finalizing.
- Do not introduce coverage targets unless the repository adds a coverage script or the task explicitly asks for coverage.

## Commands

- API tests: `npm --workspace @capture-flag/api run test`.
- API targeted test: `npm --workspace @capture-flag/api run test -- feature-flags.service.spec.ts`.
- Client tests: `npm --workspace @capture-flag/client run test`.
- Shared tests: `npm --workspace @capture-flag/shared run test`.
- Evaluator tests: `npm --workspace @capture-flag/evaluator run test`.
- SDK tests: `npm --workspace @capture-flag/sdk-js run test`.
- All workspace tests: `npm run test`.

## API Test Patterns

- Service unit tests can mock Prisma and collaborators with plain objects containing `vi.fn()` methods.
- Use `@nestjs/testing` and `supertest` for controller or integration-style tests when the Nest HTTP layer matters.
- Override `PrismaService` in Nest tests instead of reaching for a real database by default.
- Test tenant access decisions, role gates, config/environment ownership checks, revision bumps, SDK key secrecy, and public config serialization when those paths change.
- Keep Prisma mocks shaped only around methods the test exercises.

## Client And Package Test Patterns

- Do not assume Testing Library is available in `apps/client`; add new test dependencies only when the task justifies them.
- For client changes without a test harness, run the client build and describe any manual behavior that remains unverified.
- For `packages/evaluator` and `packages/sdk-js`, prefer pure unit tests around evaluation order, fallback behavior, type handling, and request/cache boundaries.

## Verification

- Search changed tests for `.only` before finishing.
- Run the targeted test file first when one exists.
- Run the affected workspace test command after the targeted test passes.
- If tests cannot be run because of missing services or dependencies, state the blocker clearly.
