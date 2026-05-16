# Testing Rules

Testing rules for this Vitest-based monorepo.

## Always

- Use Vitest APIs such as `describe`, `it`, `expect`, `vi.fn`, and `vi.spyOn`.
- Add regression tests next to changed behavior when fixing bugs.
- Test observable behavior and domain invariants instead of implementation details.
- Run a targeted test first when a specific test file exists.
- Run the affected workspace test command after targeted tests pass.
- Keep client tests in `__tests__/` folders next to the source area they cover, matching the Storybook `stories/` grouping convention.
- Keep `apps/client/src/api` request and hook tests in `src/api/__tests__`, using the existing fetch, React Query, and render helpers from `src/test`.
- Keep `apps/client/src/core` tests under `src/core/<category>/__tests__/<name>.test.ts`.
- Keep shared client component tests under `src/components/__tests__` and shared member component tests under `src/components/members/__tests__`.
- Keep page tests under `src/pages/<PageName>/__tests__` or `src/pages/<PageName>/<section>/__tests__` for colocated page internals.
- Use `src/__tests__` only for source files owned directly by `apps/client/src`, such as `permissions.ts`.
- For `apps/client` code that calls the API, cover both successful responses and API error responses with mocked fetch/response behavior.
- Keep `apps/client` coverage at 90% or higher for configured client coverage targets; aim for 100% on pure helpers and request functions.
- For API tests, mock Prisma and collaborators with plain objects containing only exercised `vi.fn()` methods.
- For SDK and evaluator packages, prefer pure unit tests around evaluation order, fallback behavior, type handling, and request/cache boundaries.

## Never

- Do not use Jest-only APIs or `jest.mock` patterns.
- Do not leave `.only` in tests.
- Do not introduce coverage targets unless a coverage script exists or the task explicitly asks for coverage.
- Do not place `apps/client` tests beside source files as loose `*.test.ts(x)` files when a nearby `__tests__/` folder is available.
- Do not add duplicate client test helpers when `src/test/render.tsx`, `src/test/api.ts`, or `src/test/pageApi.ts` already cover the setup.
- Do not reach for a real database in API unit tests by default.

## Verification

- API tests: `npm --workspace @capture-flag/api run test`.
- Client tests: `npm --workspace @capture-flag/client run test`.
- Client coverage: `npm --workspace @capture-flag/client run test:coverage`.
- Shared tests: `npm --workspace @capture-flag/shared run test`.
- Evaluator tests: `npm --workspace @capture-flag/evaluator run test`.
- SDK tests: `npm --workspace @capture-flag/sdk-js run test`.
- All workspace tests: `npm run test`.
