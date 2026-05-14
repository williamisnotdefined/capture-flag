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
