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
