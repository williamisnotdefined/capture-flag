# MVP Validation - Capture Flag

This document organizes MVP validation by phase so the team can tackle one area at a time and record evidence. The validated scope here covers the roadmap through Phase 15 - Security.

## How To Use

1. Run the phases in order, except when a validation is clearly independent.
2. Mark each item as complete only when there is objective evidence.
3. Record bugs, gaps, and decisions in the phase result block.
4. Do not include phases removed from the MVP as blockers for this checklist.

Suggested statuses:

| Status | Meaning |
|---|---|
| Pending | Not started yet |
| In progress | Validation started |
| Approved | All phase criteria passed |
| Approved with caveats | There are known gaps that do not block the MVP |
| Failed | There is a blocker for the MVP |

## Scope

Inside the MVP:

| Area |
|---|
| Multi-tenant SaaS with organizations, projects, configs, and environments |
| GitHub OAuth and session in HTTP-only cookie |
| Project members and RBAC |
| SDK keys per config + environment |
| Feature flags and remote config |
| Versioned and cacheable public Config JSON |
| Local evaluator, JS SDK, and React SDK |
| Polling, cache, ETag, and 304 |
| Segments and advanced targeting |
| Advanced audit logs |
| Public Management API |
| Security hardening from Phase 15 |

Outside the MVP:

| Phase | Reason |
|---|---|
| Phase 12 - Integrations and Webhooks | Removed from the MVP |
| Phase 14 - CLI | Removed from the MVP |
| Phase 16 - Enterprise | Removed from the MVP |
| Phase 17 - Advanced performance | Removed from the MVP |
| Phase 18 - OpenFeature | Removed from the MVP |
| Phase 19 - Mobile SDKs | Removed from the MVP |
| Phase 20 - Complete documentation | Removed from the MVP |
| Phase 21 - Billing | Removed from the MVP |

## Executive Summary

| Field | Value |
|---|---|
| Validation date | TBD |
| Responsible owner | TBD |
| Branch/commit | TBD |
| Environment | Local |
| Overall status | Pending |

## Phase 0 - Preparation

Goal: ensure the local environment and dependencies are ready for validation.

Checklist:

- [ ] `.env` created from `.env.example`.
- [ ] `GITHUB_CLIENT_ID` configured.
- [ ] `GITHUB_CLIENT_SECRET` configured.
- [ ] Docker Compose available.
- [ ] Local PostgreSQL started.
- [ ] Dependencies installed with `npm install`.
- [ ] Prisma Client generated, if necessary.
- [ ] Migrations applied with `npm run db:migrate`.

Suggested commands:

```bash
cp .env.example .env
npm install
docker compose up -d
npm run db:migrate
```

Acceptance criteria:

- [ ] API can connect to the database.
- [ ] Client can call the local API.
- [ ] GitHub login has callback configured for `http://localhost:3000/api/v1/auth/github/callback`.

Result:

| Field | Value |
|---|---|
| Status | Pending |
| Evidence | TBD |
| Bugs/Gaps | TBD |

## Phase 1 - Documentation Consistency

Goal: confirm that the documents promise the same MVP that is implemented.

Checklist:

- [ ] `README.md` states that the current state covers through Phase 15 - Security.
- [ ] `docs/EXECUTION_PLAN.md` lists Phase 15 as implemented state.
- [ ] `docs/ROADMAP.md` marks later phases as outside/removed from the MVP when applicable.
- [ ] `docs/PRODUCT.md` remains aligned with the principles of local evaluation, secure multi-tenancy, and SDK first.
- [ ] `docs/DATA_MODEL.md` describes invariants used by the API.
- [ ] `docs/CONFIG_FORMAT.md` describes the same Config JSON served by the API and consumed by SDKs.

Acceptance criteria:

- [ ] No deliverable marked as implemented is absent from the product.
- [ ] No feature removed from the MVP appears as a blocker.
- [ ] Public contracts are coherent across docs, API, evaluator, and SDKs.

Result:

| Field | Value |
|---|---|
| Status | Pending |
| Evidence | TBD |
| Bugs/Gaps | TBD |

## Phase 2 - Automated Verification

Goal: ensure tests, build, lint, and AI routes pass before manual validation.

Checklist:

- [ ] `npm run ai:check` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run test` passes.
- [ ] `npm run build` passes.
- [ ] API tests pass in isolation.
- [ ] Client tests pass in isolation.
- [ ] Evaluator tests pass in isolation.
- [ ] JS SDK tests pass in isolation.
- [ ] React SDK tests pass in isolation.

Suggested commands:

```bash
npm run ai:check
npm run lint
npm run test
npm run build
npm --workspace @capture-flag/api run test
npm --workspace @capture-flag/client run test
npm --workspace @capture-flag/evaluator run test
npm --workspace @capture-flag/sdk-js run test
npm --workspace @capture-flag/react run test
```

Acceptance criteria:

- [ ] All required commands pass without errors.
- [ ] Known failures, if any, are recorded and classified.
- [ ] No blocking automated failure remains open.

Result:

| Field | Value |
|---|---|
| Status | Pending |
| Evidence | TBD |
| Bugs/Gaps | TBD |

## Phase 3 - Manual Vertical Flow

Goal: validate the main MVP slice, from login to consuming a flag through the SDK.

Checklist:

- [ ] Start API with `npm run dev:api`.
- [ ] Start client with `npm run dev:client`.
- [ ] Access `http://localhost:5173`.
- [ ] Sign in with GitHub OAuth.
- [ ] Create an organization.
- [ ] Create a project.
- [ ] Confirm automatic creation of the `default` config.
- [ ] Create `production` environment.
- [ ] Select project, config, and environment.
- [ ] Create SDK key for `config + environment`.
- [ ] Copy the full SDK key at creation time.
- [ ] Copy the public Config JSON URL in the SDK keys panel.
- [ ] Rotate SDK key and confirm the raw key appears only at creation.
- [ ] Revoke SDK key and confirm it no longer accesses the public Config JSON.
- [ ] Create boolean feature flag.
- [ ] Confirm search, filters, tags, and status in the flag list.
- [ ] Edit value per environment.
- [ ] View Config JSON preview in the client.
- [ ] Fetch public Config JSON with the SDK key.
- [ ] Consume the flag with the JS SDK.
- [ ] Consume the flag with the React SDK, when applicable.
- [ ] Confirm audit logs generated for the main changes.

Acceptance criteria:

- [ ] User can go from zero to consuming a flag locally in the SDK.
- [ ] Public Config JSON contains only data from the SDK key config/environment.
- [ ] Flow does not require manual calls outside the product, except technical validations.

Result:

| Field | Value |
|---|---|
| Status | Pending |
| Evidence | TBD |
| Bugs/Gaps | TBD |

## Phase 4 - Feature Flags And Remote Config

Goal: validate types, values per environment, publication in Config JSON, and SDK consumption.

Checklist:

- [ ] Create `boolean` flag.
- [ ] Create `string` config.
- [ ] Create `integer` config.
- [ ] Create `double` config.
- [ ] Create `json_object` config.
- [ ] Create `json_array` config.
- [ ] Edit default value per environment for each type.
- [ ] Confirm values keep their type in the client.
- [ ] Confirm values keep their type in the API.
- [ ] Confirm values keep their type in public Config JSON.
- [ ] Confirm values keep their type in the JS SDK.
- [ ] Confirm invalid JSON is rejected by the client/API.
- [ ] Archive a flag and confirm it disappears from active lists.
- [ ] Confirm archived flag does not appear in public Config JSON.

Acceptance criteria:

- [ ] All supported types work end to end.
- [ ] Public changes increment revision/ETag when applicable.
- [ ] Invalid JSON is not saved.
- [ ] Archived flags are not delivered to SDKs.

Result:

| Field | Value |
|---|---|
| Status | Pending |
| Evidence | TBD |
| Bugs/Gaps | TBD |

## Phase 5 - Targeting, Segments And Rollout

Goal: validate local evaluation with rules, segments, prerequisites, advanced operators, and percentage rollout.

Checklist:

- [ ] Create simple rule with `equals`.
- [ ] Create rule with multiple conditions in AND.
- [ ] Create multiple rules to validate top-down OR.
- [ ] Validate base operators `contains`, `startsWith`, and `endsWith`.
- [ ] Validate base operator `oneOf`.
- [ ] Validate base operators `greaterThan` and `lessThan`.
- [ ] Create deterministic percentage rollout.
- [ ] Confirm the same user always lands in the same bucket.
- [ ] Confirm the bucket follows FNV-1a 32-bit over `${flagKey}:${attributeValue}` and range `0..9999`.
- [ ] Confirm percentages use basis points, with at most two decimal places.
- [ ] Confirm non-empty `percentageOptions` requires a sum of exactly `100%`.
- [ ] Create segment per config.
- [ ] Use segment in rule with `{ "segment": "segment-key" }`.
- [ ] Confirm segment change updates revision/ETag.
- [ ] Create prerequisite flag with `equals`.
- [ ] Create prerequisite flag with `notEquals`.
- [ ] Confirm prerequisite cycle is rejected by the API.
- [ ] Validate `arrayContains`.
- [ ] Validate `dateBefore` and `dateAfter`.
- [ ] Validate SemVer operators.
- [ ] Validate behavior with missing attribute.

Acceptance criteria:

- [ ] Evaluation Context is never sent to the API during evaluation.
- [ ] SDK/evaluator return predictable results.
- [ ] Rules are evaluated top-down.
- [ ] Prerequisites do not allow persisted cycles.
- [ ] Malformed config does not break the SDK unsafely.

Result:

| Field | Value |
|---|---|
| Status | Pending |
| Evidence | TBD |
| Bugs/Gaps | TBD |

## Phase 6 - Public Config JSON And HTTP Cache

Goal: validate the public delivery contract for SDK configuration.

Endpoint:

```http
GET /public-api/v1/sdk/:sdkKey/config
```

Checklist:

- [ ] Valid SDK key returns `200`.
- [ ] Invalid SDK key returns expected error.
- [ ] Revoked SDK key returns expected error.
- [ ] Response contains expected `schemaVersion`.
- [ ] Response contains expected `projectKey`, `configKey`, `environment`, and `generatedAt`.
- [ ] Response contains expected `revision`.
- [ ] Response contains `segments` as an object.
- [ ] Each `flags` item contains `type`, `defaultValue`, `rules`, `percentageAttribute`, and `percentageOptions`.
- [ ] Response contains only flags/settings from the correct config.
- [ ] Response contains only values from the correct environment.
- [ ] Response contains `ETag`.
- [ ] `ETag` appears only as an HTTP header, not as a required JSON field.
- [ ] Response contains `Cache-Control`.
- [ ] `If-None-Match` with current ETag returns `304 Not Modified`.
- [ ] Changing a public flag changes revision/ETag.
- [ ] Changing a public segment changes revision/ETag.
- [ ] Private tenant data does not appear in public JSON.

Acceptance criteria:

- [ ] Endpoint is cacheable and safe.
- [ ] SDK key does not allow cross-access between tenants, configs, or environments.
- [ ] Public JSON follows `docs/CONFIG_FORMAT.md`.

Result:

| Field | Value |
|---|---|
| Status | Pending |
| Evidence | TBD |
| Bugs/Gaps | TBD |

## Phase 7 - JS SDK And React SDK

Goal: validate SDK reliability while consuming public Config JSON and evaluating locally.

JS SDK checklist:

- [ ] Lazy loading works as the default mode.
- [ ] `refresh()` updates config manually.
- [ ] Auto polling updates config in the background.
- [ ] Offline mode uses local cache when available.
- [ ] In-memory cache works.
- [ ] Opt-in localStorage works in the browser.
- [ ] SDK sends `If-None-Match` when it has an ETag.
- [ ] SDK handles `304 Not Modified` without reprocessing config.
- [ ] SDK reuses valid cache when refresh fails.
- [ ] Invalid config does not replace valid cache.
- [ ] `client.close()` stops polling.
- [ ] SDK does not store raw SDK key in persistent cache.

React SDK checklist:

- [ ] Provider initializes correctly.
- [ ] `useFeatureFlag` returns fallback on initial render when necessary.
- [ ] Hook evaluates flag locally.
- [ ] Hook re-renders after config change through subscription/polling.
- [ ] Cleanup removes subscriptions on unmount.

Acceptance criteria:

- [ ] JS SDK works in Node/browser according to current scope.
- [ ] React SDK reflects changes without manual application reload.
- [ ] Network failures use fallback/cache safely.

Result:

| Field | Value |
|---|---|
| Status | Pending |
| Evidence | TBD |
| Bugs/Gaps | TBD |

## Phase 8 - Multi-Tenant And RBAC

Goal: validate tenant isolation and permissions by organization/project.

Checklist:

- [ ] Create at least two organizations.
- [ ] Create at least two projects in different organizations.
- [ ] Confirm user does not access organization without membership.
- [ ] Confirm user does not access project without valid role.
- [ ] Validate permissions for organization `owner`.
- [ ] Validate permissions for organization `admin`.
- [ ] Validate permissions for organization `member`.
- [ ] Validate permissions for organization `viewer`.
- [ ] Validate permissions for project `project_admin`.
- [ ] Validate permissions for project `developer`.
- [ ] Validate permissions for project `viewer`.
- [ ] Confirm organization `owner` and `admin` can satisfy project access without explicit membership.
- [ ] Confirm organization `member` and `viewer` need a project role to access project resources.
- [ ] Confirm organization `admin` does not create, change, or remove organization `owner`.
- [ ] Confirm the organization keeps at least one `owner`.
- [ ] Confirm viewer does not edit.
- [ ] Confirm developer does not manage members.
- [ ] Confirm project admin does not manage project without access.
- [ ] Confirm client gates are UX only and the API continues blocking improper access.

Acceptance criteria:

- [ ] Every private route validates tenant before returning data.
- [ ] Permissions match the Phase 10 roadmap matrix.
- [ ] There is no leakage between organizations, projects, configs, environments, flags, or SDK keys.

Result:

| Field | Value |
|---|---|
| Status | Pending |
| Evidence | TBD |
| Bugs/Gaps | TBD |

## Phase 9 - Audit Logs

Goal: validate traceability of important MVP changes.

Checklist:

- [ ] Flag created generates audit log.
- [ ] Flag changed generates audit log.
- [ ] Environment value changed generates audit log.
- [ ] Rule added/removed generates audit log.
- [ ] SDK key created generates audit log.
- [ ] SDK key rotated/revoked generates audit log.
- [ ] API token created generates audit log without recording raw token.
- [ ] API token revoked generates audit log without recording raw token.
- [ ] Segment created/changed/removed generates audit log.
- [ ] Organization member added/changed/removed generates audit log.
- [ ] Project member added/changed/removed generates audit log.
- [ ] Config published or equivalent change generates audit log when applicable.
- [ ] Logs display actor.
- [ ] Logs display entity.
- [ ] Logs display timestamp.
- [ ] Logs display old/new/metadata when applicable.
- [ ] Client filters by actor.
- [ ] Client filters by entity.
- [ ] Client filters by period.
- [ ] Client filters by project/config scope.

Acceptance criteria:

- [ ] Logs are immutable from the product perspective.
- [ ] No audit log requires a mandatory manual user field to be generated.
- [ ] Timeline and filterable panel allow basic operational investigation.

Result:

| Field | Value |
|---|---|
| Status | Pending |
| Evidence | TBD |
| Bugs/Gaps | TBD |

## Phase 10 - Public Management API

Goal: validate external automation through the versioned API.

Checklist:

- [ ] OpenAPI is available at `/api/v1/docs`.
- [ ] Create API token through UI/API.
- [ ] Raw token appears only at creation.
- [ ] Token is persisted only as a hash.
- [ ] Token with past or expired expiration does not authenticate.
- [ ] Project-scoped token does not access another project.
- [ ] Valid token updates `last_used_at` without blocking authentication if the usage write fails.
- [ ] Valid Bearer token authenticates under `/api/v1`.
- [ ] Token without scope receives expected error.
- [ ] Revoked token does not authenticate.
- [ ] Effective permission requires token tenant, token scope, and current RBAC of the subject user.
- [ ] Rate limit by IP works before authentication.
- [ ] Rate limit by token + IP works after authentication.
- [ ] `GET /api/v1/projects` works with authorized token.
- [ ] `POST /api/v1/projects` works with authorized token.
- [ ] `GET /api/v1/projects/:id/configs` works with authorized token.
- [ ] `POST /api/v1/projects/:id/configs` works with authorized token.
- [ ] `GET /api/v1/flags?configId=:id` works with authorized token.
- [ ] `POST /api/v1/flags` works with authorized token.
- [ ] `PATCH /api/v1/flags/:id` works with authorized token.
- [ ] `GET /api/v1/environments?projectId=:id` works with authorized token.
- [ ] Endpoints to list/add/change/remove organization members work with authorized token.
- [ ] Endpoints to list/add project members work with authorized token.
- [ ] Segment endpoints work with authorized token.
- [ ] API token creation for the MVP is validated through API/OpenAPI; dedicated UI is not an acceptance criterion for this phase.

Acceptance criteria:

- [ ] Public API covers the documented MVP automation subset.
- [ ] Scopes limit actions correctly.
- [ ] Tokens do not leak in plain text after creation.
- [ ] OpenAPI reflects public versioned management routes.

Result:

| Field | Value |
|---|---|
| Status | Pending |
| Evidence | TBD |
| Bugs/Gaps | TBD |

## Phase 11 - Security

Goal: validate the hardening documented in Phase 15.

Checklist:

- [ ] Helmet/security headers are present.
- [ ] CORS allows only configured origins.
- [ ] `CORS_ORIGINS` works with a comma-separated list.
- [ ] Legacy `CORS_ORIGIN` still works if applicable.
- [ ] Local works with `REQUIRE_HTTPS=false`.
- [ ] Production requires HTTPS when configured.
- [ ] `API_TRUST_PROXY` works for deployment behind a proxy.
- [ ] Public endpoint applies rate limit by SDK key + IP.
- [ ] Public endpoint applies global rate limit by IP.
- [ ] Public Management API applies rate limit by IP/token.
- [ ] In-memory/process-local rate limit is documented as a residual risk for multi-instance.
- [ ] Session uses HTTP-only cookie.
- [ ] Session token is saved as a hash.
- [ ] SDK key is saved as a hash.
- [ ] API token is saved as a hash.
- [ ] The last active config of a project cannot be removed in the MVP.
- [ ] Revoked SDK key does not access Config JSON.
- [ ] Revoked API token does not access Management API.
- [ ] Private queries do not leak data between tenants.

Acceptance criteria:

- [ ] Local environment remains secure without blocking development.
- [ ] Production environment blocks HTTP when required.
- [ ] Raw tokens/keys are not persisted.
- [ ] Rate limits reduce abuse by key, token, and IP.

Result:

| Field | Value |
|---|---|
| Status | Pending |
| Evidence | TBD |
| Bugs/Gaps | TBD |

## Phase 12 - Final Report

Goal: consolidate the result and decide whether the MVP is approved.

Checklist:

- [ ] Summarize executed commands.
- [ ] Attach test/build/lint results.
- [ ] Summarize validated manual flows.
- [ ] List blocking bugs.
- [ ] List non-blocking bugs.
- [ ] List documentation gaps.
- [ ] List residual risks.
- [ ] Confirm items outside the MVP.
- [ ] Define final status.

Result model:

| Field | Value |
|---|---|
| Final status | Pending |
| Executed commands | TBD |
| Approved flows | TBD |
| Blockers | TBD |
| Caveats | TBD |
| Residual risks | TBD |
| Decision | TBD |

## MVP Definition Of Done

The MVP can be considered validated when:

- [ ] `npm run test` passes.
- [ ] `npm run build` passes.
- [ ] `npm run lint` passes.
- [ ] Manual flow creates and consumes a flag through the SDK.
- [ ] Public Config JSON respects ETag/cache/tenant.
- [ ] JS SDK and React SDK work with local evaluation.
- [ ] RBAC and tenant isolation block improper access.
- [ ] Tokens, sessions, and SDK keys are not persisted raw.
- [ ] Audit logs cover important changes.
- [ ] Documentation does not promise a feature outside the MVP.
