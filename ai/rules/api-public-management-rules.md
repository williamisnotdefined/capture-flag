# API Public Management Rules

Rules for API-token-backed automation routes under `/api/v1`.

## Always

- Generate raw API tokens with `createRawApiToken()` and hash them with `hashApiToken()` before persistence.
- Return the raw API token only immediately after creation.
- Persist only `tokenHash` and a display-safe `tokenPrefix`.
- Keep API-token-capable routes behind `AuthenticatedApiGuard` or `ApiTokenGuard`, then tenant and scope guards.
- Add `@RequireApiTokenScopes()` to every route that allows API token access.
- Add `@RequireApiTokenTenant()` when a route receives organization, project, config, environment, feature flag, or segment identifiers.
- Keep API token scope names in `apiTokenScopes` and docs/OpenAPI in sync.
- Keep OpenAPI at `/api/v1/docs` restricted to the supported Public Management API subset.
- Preserve the current subset contract: projects, configs, organization/project members, flags, environments read, and segments.

## Never

- Do not store, log, audit, or re-display raw API tokens after creation.
- Do not let API tokens bypass RBAC; effective permission still depends on the token subject user.
- Do not allow project-scoped tokens to access another project or organization-level routes.
- Do not expose session-only private routes in the management OpenAPI document.
- Do not describe unsupported operations as part of management API CRUD.

## Scope Boundaries

- `projects:*` controls project listing and creation.
- `configs:*` controls project config listing and creation.
- `members:*` controls listed organization/project member automation routes.
- `flags:*` controls list, create, and update for feature flags.
- `environments:read` controls environment listing only.
- `segments:*` controls segment list, create, update, and soft delete.
