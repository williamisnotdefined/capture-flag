# Public Management API Architecture

The Public Management API is the API-token-backed automation surface for selected `/api/v1` routes.

## Route Shape

- Routes remain versioned under `/api/v1`.
- API-token-only routes can live in `ManagementApiController`.
- Existing private controllers can also accept API tokens when they use `AuthenticatedApiGuard`, API token tenant guards, and API token scope guards.
- Session-only controllers stay behind `SessionGuard` and are not part of the Public Management API.

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
- Members: list/add organization members and list/grant project members.
- Flags: list, create, and update.
- Environments: list only.
- Segments: list, create, update, and delete.

Unsupported operations should stay out of OpenAPI and docs until implemented.

## OpenAPI

- `/api/v1/docs` and `/api/v1/openapi.json` expose only the supported management subset.
- `restrictOpenApiToManagementApi()` removes session-only and public SDK routes from the document.
- Each OpenAPI operation should include the required API token scopes in its description.

## Rate Limiting

- `ManagementApiRateLimitGuard` runs before authentication for Bearer attempts and after authentication for token-specific buckets.
- Buckets are currently process-local in memory.
- Distributed rate limiting belongs to post-MVP performance/security hardening.
