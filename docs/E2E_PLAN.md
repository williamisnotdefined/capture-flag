# E2E Plan - Capture Flag

## Goal

Create an incremental end-to-end testing strategy to validate that the system works with a high level of confidence, without trying to prove "100%" correctness.

E2E here means testing the real application running against a real test database. Since the interface is still expected to change a lot, the first phase should prioritize API, public contracts, and product flows using a real database. Browser tests through the UI should start small and grow when the interface stabilizes.

## Decisions

| Area | Decision |
|---|---|
| Test location | Create workspace `apps/e2e` |
| Runner | Playwright |
| First priority | E2E/API + real database |
| Initial browser E2E | Smoke and minimal golden path |
| Database | Dedicated Postgres for E2E |
| Test auth | Session created directly in the database, without real GitHub OAuth |
| Initial parallelism | `workers: 1` to avoid data conflicts |
| Data | Reset + fixtures/factories per suite |

## Proposed Structure

```text
apps/e2e/
  package.json
  playwright.config.ts
  tests/
    00-smoke.spec.ts
    01-auth.spec.ts
    02-golden-path.spec.ts
    organizations.spec.ts
    projects.spec.ts
    environments.spec.ts
    configs.spec.ts
    feature-flags.spec.ts
    segments.spec.ts
    sdk-keys.spec.ts
    public-sdk.spec.ts
    api-tokens.spec.ts
    management-api.spec.ts
    audit-logs.spec.ts
    tenant-access.spec.ts
  support/
    api.ts
    auth.ts
    db.ts
    fixtures.ts
    ids.ts
    reset.ts
    seed.ts
```

## E2E Database

Database separate from local development:

```text
DATABASE_URL="postgresql://capture_flag:capture_flag@localhost:55433/capture_flag_e2e?schema=public"
E2E_POSTGRES_PORT=55433
```

Ideally, use a dedicated environment file such as `.env.e2e`, or scripts that inject `DATABASE_URL` explicitly. The E2E runner should never depend on the local development `.env`.

Initial strategy:

| Need | How to do it |
|---|---|
| Isolate dev from E2E | Run E2E Postgres on a separate port |
| Clean state | Truncate tables before each suite or critical test |
| Updated schema | Run Prisma migrations before the suite |
| Logged-in user | Create `users` and `sessions` directly in the database |
| Simple data | Create through the API when the test wants to validate a flow |
| Complex data | Create through a fixture/factory directly in the database |
| Reliable execution | Start with `workers: 1` |

Later, if the suite becomes slow, we can evolve to one database/schema per worker.

## Auth Strategy

Do not use real GitHub OAuth in the main E2E tests.

Recommended flow:

1. Create a user in the database.
2. Create a session with `tokenHash` calculated the way the API does it.
3. Set the `cf_session` cookie in the Playwright context or send `Cookie` in API calls.
4. Validate `/api/v1/auth/me` to confirm the session.

GitHub OAuth can have at most one separate test, manual or mocked, if it is ever needed. It should not block the main suite.

## Test Layers

| Layer | Goal | When to use |
|---|---|---|
| Unit/Service | Small rules and invariants | Already exists with Vitest |
| API E2E | Real routes + real database | Priority now |
| Contract E2E | Config JSON, SDK key, ETag, Management API | Priority now |
| Browser E2E | Critical flows through the UI | Few tests now, expand later |
| Data-heavy E2E | Database populated with lots of data | After the base is stable |

## Roadmap

### Phase 0 - Document And Planning

Goal: align on the strategy before implementing.

Deliverables:

- `docs/E2E_PLAN.md`.
- Coverage matrix for current routes.
- Dedicated database plan.
- Implementation order by risk.

### Phase 1 - Minimal Infrastructure

Goal: prove that the E2E environment starts and can talk to the API, client, and database.

Deliverables:

- Workspace `apps/e2e`.
- Playwright configured.
- Separate E2E database.
- Minimal reset and seed scripts.
- Helper to create user and session.
- Smoke tests.

Cases:

| Case | Expected result |
|---|---|
| `GET /health` | Returns `{ ok: true, service: "capture-flag-api" }` |
| Client loads | App responds in the browser |
| `/api/v1/auth/me` with valid session | Returns user and organizations |
| `/api/v1/auth/me` without session | Returns `401` |
| Logout | Invalidates session and clears later access |

### Phase 2 - Golden Path API/Contract

Goal: validate the product's main vertical slice without depending on the UI.

Flow:

1. Create an authenticated user.
2. Create organization.
3. Create project.
4. Create environment.
5. Create config.
6. Create boolean feature flag.
7. Update the flag value in the environment.
8. Query the config preview.
9. Create SDK key.
10. Query public config by SDK key.
11. Validate `ETag` and `304 Not Modified`.
12. Evaluate flag with `@capture-flag/evaluator` or `@capture-flag/sdk-js`.

Expected result:

- The created flag appears in the public config.
- The per-environment value matches the updated value.
- The revision/ETag changes when the config changes.
- The SDK/evaluator returns the expected value.

Implemented coverage:

- `apps/e2e/tests/01-golden-path.spec.ts` covers this flow through the real API, real public config, and `@capture-flag/sdk-js`.

### Phase 3 - Private Route Coverage

Goal: cover most current use cases through the real API.

High priority:

| Area | Routes/cases |
|---|---|
| Organizations | `GET /api/v1/organizations`, `POST /api/v1/organizations`, `GET /api/v1/organizations/:organizationId` |
| Organization members | list, add, update role, remove |
| Projects | list by organization, create, get, edit, delete |
| Project members | list, add, update role, remove |
| Environments | list, create, edit, delete |
| Configs | list, create, delete |
| Feature flags | list, create, edit metadata, archive/delete |
| Feature flag values | update value by environment |
| Feature flag activity | list flag activity |
| Segments | list, create, edit, delete |
| SDK keys | list, create, rotate, revoke |
| Audit logs | list and filter logs generated by important actions |

Initial implemented coverage:

- `apps/e2e/tests/02-core-resources.spec.ts` covers Phase 3A for organizations, projects, environments, and configs.
- Deletes of projects/configs created through the API validate audit history restrictions.
- Successful deletes of projects/configs use audit-free fixtures created directly in the E2E database to exercise the route without violating audit log invariants.
- `apps/e2e/tests/03-feature-flags.spec.ts` covers Phase 3B1 for feature flags, environment values, revision/ETag, no-op updates, metadata updates, activity, and soft delete.
- `apps/e2e/tests/04-segments.spec.ts` covers Phase 3B2 for segments, public config, segment references via SDK, rename/delete protections, and soft delete.
- `apps/e2e/tests/05-members.spec.ts` covers Phase 3C1 for organization members, project members, owner safety, admin owner limitations, project member scoping, and basic audit logs.
- `apps/e2e/tests/06-sdk-keys.spec.ts` covers Phase 3C2 for SDK key lifecycle, public config access, lastUsedAt, revoke, rotate, role gate, ownership checks, and audit logs without raw credentials.

Medium priority:

| Area | Cases |
|---|---|
| Validation | invalid payload returns the correct error |
| UUID params | invalid UUID returns validation error |
| Uniqueness | slugs, config keys, environment keys, active flag keys, and active segment keys |
| Soft delete | archived flag/segment is removed from active lists and public config |
| Pagination | cursors/limits in audit logs and activity |

### Phase 4 - Public Contracts And SDK

Goal: ensure external consumers do not break.

Cases:

| Area | Case |
|---|---|
| Public SDK config | `GET /public-api/v1/sdk/:sdkKey/config` returns valid Config JSON |
| Invalid SDK key | Returns expected error without leaking data |
| Revoked SDK key | Does not return config |
| ETag | Second call with `If-None-Match` returns `304` |
| Cache headers | `ETag` and `Cache-Control` are present |
| Config preview | Authenticated preview matches the public config for the same config+environment pair |
| Archived flag | Does not appear in Config JSON |
| Archived segment | Does not appear in Config JSON |
| Targeting rules | Valid rules appear normalized |
| Percentage rollout | Options add up to 100 and are emitted correctly |
| Prerequisite flags | Valid references appear and invalid references fail |
| SDK JS | `createClient().getValue()` fetches real config and evaluates expected value |

Initial implemented coverage:

- `apps/e2e/tests/07-public-targeting.spec.ts` covers Phase 4A for invalid SDK key, preview/public consistency, percentage rollout, advanced operators, prerequisite flags, prerequisite protections, and ETag/revision on targeting changes.

### Phase 5 - Security And Tenant Access

Goal: catch dangerous access and isolation bugs.

Cases:

| Area | Case |
|---|---|
| Missing session | Private routes return `401` |
| Invalid/revoked session | Returns `401` and clears cookie when applicable |
| Logout | Revoked session cannot access `/auth/me` |
| Tenant isolation | User from org A cannot access org/project/config from org B |
| Organization roles | `member`/`viewer` cannot manage members when not allowed |
| Project roles | `viewer` cannot manage flags, segments, or administrative resources |
| Org owner/admin | Can satisfy project access according to the current contract |
| Project admin | Manages project administrative resources |
| Developer | Manages feature flags according to the current contract |
| Segment manager | Only allowed roles manage segments |

Initial implemented coverage:

- `apps/e2e/tests/08-tenant-access.spec.ts` covers Phase 5A for cross-tenant organization/project/config access, project membership required for organization members, viewer read-only access, and developer flag-only access.

### Phase 6 - API Tokens And Management API

Goal: validate external automation and scopes.

API token cases:

| Case | Expected result |
|---|---|
| Create organizational token | Returns raw token only once and persisted prefix |
| List tokens | Does not return raw secret |
| Revoke token | Token no longer authenticates |
| Expired token | Does not authenticate |
| Project-scoped token | Cannot access resources from another project |
| Insufficient scope | Returns `403` |
| Missing/invalid token | Returns `401` |

Management API cases:

| Route | Cases |
|---|---|
| `GET /api/v1/projects` | lists token projects according to tenant |
| `POST /api/v1/projects` | creates project when token allows it |
| `GET /api/v1/flags?configId=` | lists flags with `flags:read` |
| `POST /api/v1/flags` | creates flag with `flags:write` |
| `PATCH /api/v1/flags/:id` | updates flag with the correct tenant |
| `GET /api/v1/environments?projectId=` | lists environments with `environments:read` |

Initial implemented coverage:

- `apps/e2e/tests/09-api-tokens-management-api.spec.ts` covers Phase 6A for API token lifecycle, one-time raw token exposure, revocation, expiration, role gates, audit logs without raw secret, Management API Bearer authentication, insufficient scopes, and organization-scoped/project-scoped token isolation.

### Phase 7 - Browser E2E

Goal: validate that critical flows work through the interface.

Since the UI will still change, start small.

Initial cases:

| Flow | Expected result |
|---|---|
| Fake login/session | Authenticated user reaches `/organizations` |
| Create organization | Organization appears as selectable |
| Create project | Project appears and navigation works correctly |
| Create environment/config | Resources appear in the project context |
| Create feature flag | Flag appears in the list |
| Update value | Preview/public config reflects the change |
| Create SDK key | Raw key appears once and list shows prefix/status |

Rules for browser tests:

- Use stable selectors when possible.
- Avoid testing visual details while the interface is changing.
- Prefer validating observable behavior and real calls/results.
- Keep a few long tests; add more only when the flow stabilizes.

Initial implemented coverage:

- `apps/e2e/tests/10-browser-core-flows.spec.ts` covers Phase 7A for fake login by browser cookie, organization/project creation through the UI, cold URL with full context preserved, environment/config/flag/value creation through the UI, preview JSON reflecting the published value, and smoke on a mobile viewport.

### Phase 8 - Populated Database And Complex Data

Goal: test functions that need lots of data and realistic states.

Suggested fixtures:

| Fixture | Contents |
|---|---|
| `smallWorkspace` | 1 org, 1 user, 1 project, 1 config, 2 environments |
| `flagWorkspace` | smallWorkspace + several flags of all types |
| `targetingWorkspace` | flags with rules, segments, prerequisites, and rollouts |
| `rbacWorkspace` | several users with different roles |
| `tokenWorkspace` | org-scoped, project-scoped, revoked, and expired API tokens |
| `largeWorkspace` | dozens of projects/configs/environments and hundreds of flags |

Cases:

| Area | Case |
|---|---|
| Lists | Many items still appear and update correctly |
| Filters/context | Select the correct org/project/config/environment |
| Updates | Bulk edits do not affect the wrong tenant |
| Audit | Logs remain filterable with larger volume |
| Config JSON | Only active resources appear |
| Basic performance | Main flows remain usable on a larger dataset |

Initial implemented coverage:

- `apps/e2e/support/fixtures.ts` adds reusable fixtures for `smallWorkspace`, `flagWorkspace`, `targetingWorkspace`, `rbacWorkspace`, and `tokenWorkspace` with moderate volume and mixed states.
- `apps/e2e/tests/11-populated-data.spec.ts` covers Phase 8A for lists in a populated workspace, config/environment isolation, public delivery with active flags, local targeting via SDK, audit pagination/filters, absence of raw secrets in logs, project-scoped API token, and RBAC in a workspace with many resources.

### Phase 9 - Security And Hardening

Goal: validate the MVP hardening contracts without depending on real external configuration.

Cases:

| Area | Case |
|---|---|
| HTTP security | Basic Helmet headers and configured CORS |
| HTTPS/proxy | Parsing of `REQUIRE_HTTPS` and `API_TRUST_PROXY` in unit tests |
| Rate limit | Fixed-window store and Public SDK/Management API guards |
| OpenAPI | Public JSON contains only versioned Management API routes |
| Secrets | Session, SDK key, and API token persisted as hashes |
| Revocation | Revoked SDK key/API token blocked in a real flow |

Initial implemented coverage:

- `apps/api/src/security/http-security.spec.ts`, `apps/api/src/common/fixed-window-rate-limit.spec.ts`, `apps/api/src/public-sdk/public-sdk-rate-limit.guard.spec.ts`, and `apps/api/src/api-tokens/management-api-rate-limit.guard.spec.ts` cover Phase 9A for security env parsing, HTTPS middleware, and rate-limit stores/guards.
- `apps/e2e/tests/12-security-contract.spec.ts` covers Phase 9A for real headers/CORS, restricted OpenAPI, hash-only credential persistence, and blocking revoked keys/tokens.

## Current Route Matrix

### Health

| Method | Route | Target coverage |
|---|---|---|
| GET | `/health` | Phase 1 |

### Auth

| Method | Route | Target coverage |
|---|---|---|
| GET | `/api/v1/auth/github/start` | Unit/integration; real E2E optional |
| GET | `/api/v1/auth/github/callback` | Unit/integration; real E2E optional |
| GET | `/api/v1/auth/me` | Phase 1 |
| POST | `/api/v1/auth/logout` | Phase 1 |

### Organizations

| Method | Route | Target coverage |
|---|---|---|
| GET | `/api/v1/organizations` | Phase 3 |
| POST | `/api/v1/organizations` | Phase 2/3 |
| GET | `/api/v1/organizations/:organizationId` | Phase 3 |
| GET | `/api/v1/organizations/:organizationId/members` | Phase 3/6 |
| POST | `/api/v1/organizations/:organizationId/members` | Phase 3/6 |
| PATCH | `/api/v1/organizations/:organizationId/members/:memberId` | Phase 3/6 |
| DELETE | `/api/v1/organizations/:organizationId/members/:memberId` | Phase 3/6 |

### Projects

| Method | Route | Target coverage |
|---|---|---|
| GET | `/api/v1/organizations/:organizationId/projects` | Phase 3 |
| POST | `/api/v1/organizations/:organizationId/projects` | Phase 2/3 |
| GET | `/api/v1/projects/:projectId` | Phase 3 |
| PATCH | `/api/v1/projects/:projectId` | Phase 3 |
| DELETE | `/api/v1/projects/:projectId` | Phase 3 |
| GET | `/api/v1/projects/:projectId/members` | Phase 3/6 |
| POST | `/api/v1/projects/:projectId/members` | Phase 3/6 |
| PATCH | `/api/v1/projects/:projectId/members/:memberId` | Phase 3/6 |
| DELETE | `/api/v1/projects/:projectId/members/:memberId` | Phase 3/6 |

### Environments

| Method | Route | Target coverage |
|---|---|---|
| GET | `/api/v1/projects/:projectId/environments` | Phase 3/6 |
| POST | `/api/v1/projects/:projectId/environments` | Phase 2/3 |
| PATCH | `/api/v1/environments/:environmentId` | Phase 3 |
| DELETE | `/api/v1/environments/:environmentId` | Phase 3 |

### Configs

| Method | Route | Target coverage |
|---|---|---|
| GET | `/api/v1/projects/:projectId/configs` | Phase 3/6 |
| POST | `/api/v1/projects/:projectId/configs` | Phase 2/3 |
| DELETE | `/api/v1/configs/:configId` | Phase 3 |

### Feature Flags

| Method | Route | Target coverage |
|---|---|---|
| GET | `/api/v1/configs/:configId/feature-flags` | Phase 3 |
| POST | `/api/v1/configs/:configId/feature-flags` | Phase 2/3 |
| PATCH | `/api/v1/configs/:configId/feature-flags/:featureFlagId` | Phase 3 |
| DELETE | `/api/v1/configs/:configId/feature-flags/:featureFlagId` | Phase 3 |
| GET | `/api/v1/configs/:configId/feature-flags/:featureFlagId/activity` | Phase 3 |
| PATCH | `/api/v1/configs/:configId/feature-flags/:featureFlagId/environments/:environmentId/value` | Phase 2/3/4 |

### Segments

| Method | Route | Target coverage |
|---|---|---|
| GET | `/api/v1/configs/:configId/segments` | Phase 3/6 |
| POST | `/api/v1/configs/:configId/segments` | Phase 3/6 |
| PATCH | `/api/v1/configs/:configId/segments/:segmentId` | Phase 3/6 |
| DELETE | `/api/v1/configs/:configId/segments/:segmentId` | Phase 3/6 |

### SDK Keys

| Method | Route | Target coverage |
|---|---|---|
| GET | `/api/v1/projects/:projectId/sdk-keys` | Phase 3 |
| POST | `/api/v1/projects/:projectId/sdk-keys` | Phase 2/3 |
| POST | `/api/v1/sdk-keys/:sdkKeyId/revoke` | Phase 3/4 |
| POST | `/api/v1/sdk-keys/:sdkKeyId/rotate` | Phase 3/4 |

### Public SDK And Preview

| Method | Route | Target coverage |
|---|---|---|
| GET | `/public-api/v1/sdk/:sdkKey/config` | Phase 2/4 |
| GET | `/api/v1/configs/:configId/environments/:environmentId/config-preview` | Phase 2/4 |

### Audit Logs

| Method | Route | Target coverage |
|---|---|---|
| GET | `/api/v1/organizations/:organizationId/audit-logs` | Phase 3/8 |

### API Tokens

| Method | Route | Target coverage |
|---|---|---|
| GET | `/api/v1/organizations/:organizationId/api-tokens` | Phase 6 |
| POST | `/api/v1/organizations/:organizationId/api-tokens` | Phase 6 |
| POST | `/api/v1/api-tokens/:apiTokenId/revoke` | Phase 6 |

### Management API

| Method | Route | Target coverage |
|---|---|---|
| GET | `/api/v1/projects` | Phase 6 |
| POST | `/api/v1/projects` | Phase 6 |
| GET | `/api/v1/flags?configId=` | Phase 6 |
| POST | `/api/v1/flags` | Phase 6 |
| PATCH | `/api/v1/flags/:id` | Phase 6 |
| GET | `/api/v1/environments?projectId=` | Phase 6 |

## Current Page Matrix

| Page | Client route | Suggested browser coverage |
|---|---|---|
| Login | `/login` | Smoke only while real OAuth is not used |
| Organizations | `/organizations`, `/organizations/:organizationId` | Phase 7 |
| Projects | `/organizations/:organizationId/projects`, `/organizations/:organizationId/projects/:projectId` | Phase 7 |
| Environments | `/organizations/:organizationId/projects/:projectId/environments` | Phase 7 |
| Configs | `/organizations/:organizationId/projects/:projectId/configs`, `/organizations/:organizationId/projects/:projectId/configs/:configId` | Phase 7 |
| Flags | `/organizations/:organizationId/projects/:projectId/configs/:configId/flags` | Phase 7 |
| Segments | `/organizations/:organizationId/projects/:projectId/configs/:configId/segments` | Phase 7 |
| SDK Keys | `/organizations/:organizationId/projects/:projectId/sdk-keys` | Phase 7 |
| Audit Logs | `/organizations/:organizationId/audit-logs` | Phase 7/8 |

## Data And Factories

Recommended helpers:

| Helper | Responsibility |
|---|---|
| `resetDatabase()` | Clear tables in safe order |
| `createUser()` | Create user with unique email |
| `createSession()` | Create raw token + hash and return cookie |
| `createOrganization()` | Create org + membership |
| `createProject()` | Create project + optional membership |
| `createEnvironment()` | Create environment |
| `createConfig()` | Create config and required states |
| `createFeatureFlag()` | Create flag and values by environment |
| `createSegment()` | Create active segment |
| `createSdkKey()` | Create SDK key and return raw key when needed |
| `createApiToken()` | Create API token and return raw token when needed |

Practical rule:

- Use API to validate real creation flows.
- Use DB factory to assemble complex states quickly.
- Never share state between test files without explicit reset.

## Target Commands

Suggested future scripts:

```json
{
  "scripts": {
    "e2e": "npm --workspace @capture-flag/e2e run test",
    "e2e:ui": "npm --workspace @capture-flag/e2e run test:ui",
    "e2e:headed": "npm --workspace @capture-flag/e2e run test:headed"
  }
}
```

Expected local flow:

```bash
npm --workspace @capture-flag/e2e run install:browsers
npm run e2e:db:up
npm run e2e
```

The E2E workspace prepares the database automatically before running the tests. By default it uses `postgresql://capture_flag:capture_flag@localhost:55433/capture_flag_e2e?schema=public`; to override it, use `E2E_DATABASE_URL`. The runner does not use the local development `.env`.

## Ready Criteria

An E2E phase should only be considered ready when:

- It runs locally with a clean E2E database.
- It does not depend on manual data.
- It does not depend on real GitHub OAuth.
- It fails with a clear message when the API/client/database does not start.
- It can run in CI.
- It does not modify the development database.
- It documents any known limitation.

## Risks And Controls

| Risk | Control |
|---|---|
| Suite too slow | Start with a few critical cases and direct database fixtures |
| Changing UI breaks everything | Prioritize API E2E now and only a few browser E2E tests |
| Flaky tests | Avoid sleeps; use Playwright assertions/events/retries |
| State leaking between tests | Database reset and `workers: 1` initially |
| Wrong database gets deleted | Validate `DATABASE_URL` contains `e2e` before resetting |
| Credentials leak | Generate fake tokens in tests and never commit real `.env` |
| Testing implementation too much | Validate observable behavior and public contracts |

## First Recommended Implementation

Small scope for the first PR:

1. Create `apps/e2e`.
2. Add Playwright.
3. Add E2E Postgres to Docker Compose or a separate compose file.
4. Create `db`, `reset`, and `auth` helpers.
5. Create smoke tests for `/health`, `/auth/me`, and client loading.
6. Create the start of the golden path up to creating a feature flag through the API.

Do not implement all phases at once.
