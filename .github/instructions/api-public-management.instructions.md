---
applyTo: "apps/api/src/management-api/**/*.ts,apps/api/src/api-tokens/**/*.ts,apps/api/src/auth/authenticated-api.guard.ts,apps/api/src/auth/session-or-api-token-controller.decorator.ts,apps/api/src/security/**/*.ts,apps/api/src/main.ts,apps/api/src/**/*controller.ts,apps/api/test/management-api*.spec.ts,apps/api/test/api-token*.spec.ts,docs/ROADMAP.md,docs/TECHNICAL_DECISIONS.md,docs/MVP_VALIDATION.md"
---

Generated from `ai/registry.json`. Do not edit manually.

Canonical skill: `../../ai/skills/api-public-management.md`.

Referenced context:
- `../../ai/rules/api-public-management-rules.md`
- `../../ai/rules/security-hardening-rules.md`
- `../../ai/rules/api-tenant-access-rules.md`
- `../../ai/architecture/public-management-api.md`
- `../../ai/architecture/security-hardening.md`
- `../../ai/architecture/api-app.md`
- `../../ai/examples/good-management-api-contract.md`

This file is compiled from canonical AI knowledge files. Edit canonical files under `ai`, then run `npm run ai:sync`.

# Compiled AI Skill: api-public-management

## Canonical Skill: `ai/skills/api-public-management.md`

# API Public Management

Use this skill when changing Public Management API routes, API tokens, token scopes, Bearer authentication, management OpenAPI output, rate limits, or security hardening in `apps/api`.

## Goal

Preserve API-token automation as a documented, scope-limited, tenant-safe subset of `/api/v1` without weakening session-only private routes or public SDK contracts.

## Read First

- `ai/rules/api-public-management-rules.md`
- `ai/rules/security-hardening-rules.md`
- `ai/rules/api-tenant-access-rules.md`
- `ai/architecture/public-management-api.md`
- `ai/architecture/security-hardening.md`
- `ai/architecture/api-app.md`
- `ai/examples/good-management-api-contract.md`

## External Docs

- `docs/ROADMAP.md`
- `docs/TECHNICAL_DECISIONS.md`
- `docs/MVP_VALIDATION.md`

## Workflow

- Identify whether the route is session-only, API-token-only, or dual session/API-token.
- Treat `SessionOrApiTokenController` and `AuthenticatedApiGuard` as part of the Public Management API auth boundary.
- Keep API tokens hash-only and raw-token display limited to creation responses.
- Treat `managementApiRoutes` as the source of truth for the documented Public Management API subset.
- Add or update controller decorators, tenant requirements, scopes, RBAC checks, `managementApiRoutes`, OpenAPI expectations, and route metadata tests together.
- Keep dual session/API-token controllers session-only for methods without `@RequireApiTokenScopes()`.
- Keep `/api/v1/docs` restricted to the supported management subset.
- Preserve the two `ManagementApiRateLimitGuard` positions: before Bearer authentication and after token authentication.
- Update docs when the management API subset, scopes, OpenAPI output, rate limits, or security posture changes.
- Call out process-local rate limit limitations unless a distributed limiter is implemented.

## Expected Output

- API tokens cannot bypass tenant boundaries, scopes, or subject-user RBAC.
- Unsupported management operations are not exposed in OpenAPI or described as implemented.
- `managementApiRoutes`, controller metadata, OpenAPI filtering, and tests stay aligned.
- Raw credentials are not persisted, logged, audited, or re-displayed.

## Verification

- Run `npm --workspace @capture-flag/api run test -- management-api-route-metadata.spec.ts management-api-openapi.spec.ts` after management route contract changes.
- Run `npm --workspace @capture-flag/api run test` after API token, scope, rate limit, or security changes.
- Run `npm --workspace @capture-flag/api run build` after controller, guard, or bootstrap changes.
- Run `npm run ai:check` after AI knowledge changes.

# Referenced Context

## Reference: `ai/rules/api-public-management-rules.md`

# API Public Management Rules

Rules for API-token-backed automation routes under `/api/v1`.

## Always

- Generate raw API tokens with `createRawApiToken()` and hash them with `hashApiToken()` before persistence.
- Return the raw API token only immediately after creation.
- Persist only `tokenHash` and a display-safe `tokenPrefix`.
- Keep API-token-capable private controllers behind `SessionOrApiTokenController`, or API-token-only routes behind `ApiTokenGuard`, then tenant and scope guards.
- Add `@RequireApiTokenScopes()` to every route that allows API token access.
- Add `@RequireApiTokenTenant()` when a route receives organization, project, config, environment, feature flag, or segment identifiers.
- Keep `managementApiRoutes` aligned with every documented API-token route's controller, handler, method, path, scopes, tenant metadata, and auth mode.
- Update management route metadata and OpenAPI tests when scopes, tenant metadata, supported routes, guard order, or documented paths change.
- Keep API token scope names in `apiTokenScopes` and docs/OpenAPI in sync.
- Keep OpenAPI at `/api/v1/docs` restricted to the supported Public Management API subset.
- Preserve the current subset contract: projects, configs, organization/project members, flags, environments read, and segments.
- Preserve dual controller behavior: session requests can use the controller, but API-token requests require method-level scope metadata.
- Preserve Management API rate limiting before Bearer authentication and after API token authentication.

## Never

- Do not store, log, audit, or re-display raw API tokens after creation.
- Do not let API tokens bypass RBAC; effective permission still depends on the token subject user.
- Do not allow project-scoped tokens to access another project or organization-level routes.
- Do not assume `SessionOrApiTokenController` makes every method API-token-accessible.
- Do not expose a controller route to API tokens without adding scopes, tenant metadata when needed, `managementApiRoutes`, and route/OpenAPI tests.
- Do not expose session-only private routes in the management OpenAPI document.
- Do not describe unsupported operations as part of management API CRUD.
- Do not remove the repeated `ManagementApiRateLimitGuard` around `AuthenticatedApiGuard` as duplicate code.

## Scope Boundaries

- `projects:*` controls project listing and creation.
- `configs:*` controls project config listing and creation.
- `members:*` controls listed organization/project member automation routes, including supported organization member update and removal.
- `flags:*` controls list, create, and update for feature flags.
- `environments:read` controls environment listing only.
- `segments:*` controls segment list, create, update, and soft delete.

## Contract Files

- `apps/api/src/management-api/management-api-contract.ts` defines the supported route set.
- `apps/api/src/management-api/management-api-openapi.ts` derives documented OpenAPI paths and scope descriptions from that contract.
- `apps/api/test/management-api-route-metadata.spec.ts` keeps controller decorators aligned with the contract.
- `apps/api/test/management-api-openapi.spec.ts` keeps OpenAPI filtering aligned with the contract.

## Reference: `ai/rules/security-hardening-rules.md`

# Security Hardening Rules

Rules for API HTTP security, rate limits, and secret handling.

## Always

- Apply HTTP security through `applyHttpSecurity()` in API bootstrap.
- Keep Helmet enabled and HSTS tied to HTTPS-required mode.
- Require explicit CORS origins in production through `CORS_ORIGINS`, `CORS_ORIGIN`, or `CLIENT_BASE_URL`.
- Keep HTTPS required by default in production and configurable locally through `REQUIRE_HTTPS`.
- Use `API_TRUST_PROXY` when deployed behind trusted reverse proxies.
- Hash raw sessions, SDK keys, and API tokens before persistence.
- Keep rate limit bucket keys free of raw SDK keys or raw API tokens.
- Document the MVP rate limit limitation: guards use in-memory Maps and are process-local.
- Add or update regression tests when changing auth, CORS, HTTPS, rate limit, or hash-only credential behavior.

## Never

- Do not weaken production CORS to wildcard origins with credentials.
- Do not persist raw credentials in database rows, logs, audit payloads, or persistent SDK caches.
- Do not treat in-memory rate limits as distributed protection across multiple API instances.
- Do not rely on client-side gates for security; API guards and services remain authoritative.

## Current Rate Limits

- Public SDK config endpoint: global IP bucket plus SDK key/IP bucket.
- Public Management API: IP bucket before Bearer authentication and API token/IP bucket after authentication.
- Both current implementations are suitable for local/MVP operation, not multi-instance abuse protection.

## Reference: `ai/rules/api-tenant-access-rules.md`

# API Tenant Access Rules

Rules for private API authorization and tenant isolation.

## Always

- Use `SessionGuard` and `AuthenticatedRequest` on session-only private API controllers.
- Use `AuthenticatedApiGuard` plus API token tenant/scope guards on private management routes that also accept API tokens.
- Keep controllers thin: parse route params, pass `request.user.id`, and delegate rules to services.
- Enforce tenant access through `AccessService` before returning or mutating tenant-owned data.
- Resolve parent organization, project, config, environment, SDK key, or flag and verify it belongs to the current tenant path.
- Use `requireProjectAccess` for project-scoped reads.
- Use `requireProjectRole` for project-scoped writes with the narrowest allowed project roles.
- Use `requireOrganizationMember` or `requireOrganizationRole` for organization-level reads and writes.
- Preserve the rule that organization `owner` and `admin` roles can satisfy project access without explicit project membership.
- Preserve owner safety: organization admins cannot create, change, or remove organization owners, and organizations must keep at least one owner.
- Keep project `developer` scoped to feature flag writes; do not allow it to manage segments, SDK keys, environments, configs, project members, or roles.

## Never

- Do not trust global IDs alone.
- Do not leak cross-tenant data through `include` or nested `select` shapes.
- Do not perform private API reads or writes before access checks.
- Do not expose whether a public SDK key ever existed when it is missing or revoked.
- Do not make public SDK endpoints depend on session auth; they authenticate through hashed SDK keys.

## Required Domain Checks

- `configId` and `environmentId` must belong to the same `projectId` before SDK keys, flag values, or config state changes.
- Project ownership must be validated before listing configs, environments, members, SDK keys, and feature flags.
- Organization ownership must be validated before adding organization or project members.
- Segment mutations require project administrative access because segments are reusable targeting assets shared by flag rules.

## Reference: `ai/architecture/public-management-api.md`

# Public Management API Architecture

The Public Management API is the API-token-backed automation surface for selected `/api/v1` routes.

## Route Shape

- Routes remain versioned under `/api/v1`.
- API-token-only routes can live in `ManagementApiController`.
- Existing private controllers can also accept API tokens when they use `SessionOrApiTokenController`, which wires `AuthenticatedApiGuard`, management rate limits, API token tenant guards, and API token scope guards.
- Session-only controllers stay behind `SessionGuard` and are not part of the Public Management API.
- Dual session/API-token controllers still require method-level API token scope metadata; methods without scopes remain session-only for API-token callers.

## Route Contract

- `managementApiRoutes` is the source of truth for the documented automation subset.
- Each contract entry records the controller, handler, HTTP method, OpenAPI path, required scopes, tenant requirement, and whether the route is API-token-only or dual session/API-token.
- Route metadata tests compare `managementApiRoutes` with controller paths, methods, scopes, tenant metadata, auth mode, and guard order.
- OpenAPI tests compare `managementApiRoutes` with the filtered `/api/v1/docs` and `/api/v1/openapi.json` output.

## Authentication And Authorization

- API tokens are Bearer tokens created by authenticated users.
- Raw tokens are shown only once; the database stores SHA-256 hash and `tokenPrefix`.
- Valid tokens attach `request.user` for the token subject and `request.apiToken` for organization/project/scopes.
- Access requires all three checks: token tenant boundary, token scopes, and effective RBAC for the subject user.
- Organization-scoped tokens can access the organization subset allowed by their scopes.
- Project-scoped tokens can access only that project and must not access organization-level routes.

## Supported Automation Subset

- Projects: list and create.
- Configs: list and create within a project.
- Members: list, add, update, and remove organization members; list and grant project members.
- Flags: list, create, and update.
- Environments: list only.
- Segments: list, create, update, and delete.

Unsupported operations should stay out of OpenAPI and docs until implemented.

## OpenAPI

- `/api/v1/docs` and `/api/v1/openapi.json` expose only the supported management subset.
- `restrictOpenApiToManagementApi()` derives allowed paths and methods from `managementApiRoutes` and removes session-only and public SDK routes from the document.
- Each OpenAPI operation should include the required API token scopes in its description.

## Rate Limiting

- `ManagementApiRateLimitGuard` intentionally runs before `AuthenticatedApiGuard` for Bearer attempts and after authentication for token-specific buckets.
- Buckets are currently process-local in memory.
- Distributed rate limiting belongs to post-MVP performance/security hardening.

## Reference: `ai/architecture/security-hardening.md`

# Security Hardening Architecture

Capture Flag applies MVP hardening at API bootstrap and sensitive route guards.

## HTTP Boundary

- `applyHttpSecurity()` installs Helmet, CORS, optional trust proxy, and HTTPS enforcement.
- Production always requires HTTPS.
- Local development can set `REQUIRE_HTTPS=false`.
- Deployments behind a proxy must configure `API_TRUST_PROXY` so Express sees the intended protocol and IP.

## CORS

- CORS allows credentials for the configured client origins.
- Production must provide an explicit origin list through `CORS_ORIGINS`, `CORS_ORIGIN`, or `CLIENT_BASE_URL`.
- Local development falls back to `http://localhost:5173`.

## Hash-Only Credentials

- Sessions store only token hashes in `sessions.token_hash`.
- SDK keys store only `key_hash` plus `key_prefix`.
- API tokens store only `token_hash` plus `token_prefix`.
- Audit logs and support-facing data use prefixes or IDs, never raw credentials.

## Rate Limit Boundaries

- Public SDK config requests are limited by IP and SDK key/IP.
- Public Management API Bearer requests are limited by IP before auth and API token/IP after auth.
- Current guards use in-memory Maps; every API process has independent counters.
- Multi-instance deployments need a distributed limiter before claiming platform-wide abuse protection.

## Reference: `ai/architecture/api-app.md`

# API App Architecture

`apps/api` is a NestJS API backed by Prisma and PostgreSQL.

## Request Flow

- Controllers define routes, parse params, receive DTOs, and pass `request.user.id` to services.
- Session-only private controllers use `SessionGuard` and `AuthenticatedRequest`.
- API-token-capable management controllers use `AuthenticatedApiGuard`, then API token tenant/scope guards.
- API-token-only management routes can use `ApiTokenGuard` directly, followed by tenant/scope guards.
- DTO classes validate and normalize request bodies.
- UUID route params use `UuidParam`, the shared wrapper around `ParseUUIDPipe`, in controllers.
- Services own authorization, existence checks, ownership checks, business rules, and Prisma calls.

## Module Structure

- API modules use explicit Nest imports, controllers, providers, and exports.
- Controllers stay thin and delegate to facade services or focused use-case services.
- Facade services are module boundaries for controllers or cross-module consumers; they should delegate rather than own business rules.
- Use-case services own operation behavior, tenant checks, Prisma calls, transactions, audit writes, config-state bumps, and no-op behavior.
- `support` services hold concrete reusable responsibilities such as access, audit, input normalization, read models, credentials, config state, references, validation, writers, or initializers.
- Modules export only the current boundary needed by another module, not internal support providers by default.

## Persistence

- Prisma schema and migrations define the data model.
- Prisma access is injected through `PrismaService`.
- Tenant checks usually resolve parent entities before child reads or writes.
- Constraint and uniqueness errors are mapped through the shared Prisma exception filter.

## Public SDK Boundary

- Public SDK config routes are unauthenticated by session.
- SDK keys authenticate public config access through hashed key lookup.
- SDK evaluation context never reaches the API.
- Public config output is a versioned SDK contract, not an internal API DTO.

## Public Management Boundary

- Public Management API automation uses API tokens as Bearer credentials on a documented subset of `/api/v1`.
- API token routes require tenant checks, scope checks, and normal RBAC checks through the token subject user.
- OpenAPI at `/api/v1/docs` is filtered to the supported management subset.
- Management rate limits are currently process-local in memory.

## Security Boundary

- API bootstrap calls `applyHttpSecurity()` before request handling.
- Helmet, CORS, HTTPS enforcement, trust proxy, and rate limit guards live in API infrastructure, not services.
- Raw session tokens, SDK keys, and API tokens must not be persisted or logged.

## Reference: `ai/examples/good-management-api-contract.md`

# Good Management API Contract

Source: `apps/api/src/management-api/management-api-contract.ts` (sha256: `020a70dc12de6839d7865a8ceb4a540681ea597703b81ee355c08c5b405cadbf`)
Source: `apps/api/src/management-api/management-api-openapi.ts` (sha256: `70d39e4d03ecd18e900f4b9accd4b46aa0857920b65ef92512af42ec9863dfa3`)
Source: `apps/api/test/management-api-route-metadata.spec.ts` (sha256: `e66be56e794fb62486460a198fdcbcb31d603db7057c36a78b944545f6e622b9`)
Source: `apps/api/test/management-api-openapi.spec.ts` (sha256: `6ad25a1e675fd499fe095d31c7f74393eba589a4aea32ba9e8cd6a26995934ab`)

Why this is canonical:

- Keeps the Public Management API subset explicit instead of inferring support from controller routes.
- Keeps API token scopes, tenant metadata, auth mode, route paths, and OpenAPI output aligned.
- Preserves dual controller behavior where session requests can use the controller but API tokens need method-level scope metadata.
- Verifies that rate limiting runs before and after API token authentication.

## Contract Entry

```ts
{
  apiTokenAccess: "session-or-api-token",
  controller: "SegmentsController",
  handler: "update",
  method: "patch",
  path: "/api/v1/configs/{configId}/segments/{segmentId}",
  scopes: ["segments:write"],
  tenant: { configParam: "configId", segmentParam: "segmentId" },
}
```

Every API-token-supported route records auth mode, controller method, documented path, required scopes, and tenant identifiers.

## OpenAPI Filtering

```ts
for (const route of managementApiRoutes) {
  const routeMethods = routes[route.path] ?? {};
  routeMethods[route.method] = route.scopes;
  routes[route.path] = routeMethods;
}
```

The OpenAPI allowlist is derived from the route contract so unsupported session-only and public SDK routes stay out of `/api/v1/docs`.

## Metadata Tests

```ts
for (const route of managementApiRoutes) {
  expect(scopes(controllerFor(route.controller), route.handler)).toEqual(route.scopes);
  expect(tenantRequirement(controllerFor(route.controller), route.handler)).toEqual(route.tenant);
}
```

Tests keep controller decorators aligned with the contract. Non-contract methods on dual controllers must not define API token scope or tenant metadata.
