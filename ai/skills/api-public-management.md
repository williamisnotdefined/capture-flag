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

## External Docs

- `docs/ROADMAP.md`
- `docs/TECHNICAL_DECISIONS.md`
- `docs/MVP_VALIDATION.md`

## Workflow

- Identify whether the route is session-only, API-token-only, or dual session/API-token.
- Keep API tokens hash-only and raw-token display limited to creation responses.
- Add or update tenant requirements, scopes, and RBAC checks together.
- Keep `/api/v1/docs` restricted to the supported management subset.
- Update docs when the management API subset, scopes, OpenAPI output, rate limits, or security posture changes.
- Call out process-local rate limit limitations unless a distributed limiter is implemented.

## Expected Output

- API tokens cannot bypass tenant boundaries, scopes, or subject-user RBAC.
- Unsupported management operations are not exposed in OpenAPI or described as implemented.
- Raw credentials are not persisted, logged, audited, or re-displayed.

## Verification

- Run `npm --workspace @capture-flag/api run test` after API token, scope, rate limit, or security changes.
- Run `npm --workspace @capture-flag/api run build` after controller, guard, or bootstrap changes.
- Run `npm run ai:check` after AI knowledge changes.
