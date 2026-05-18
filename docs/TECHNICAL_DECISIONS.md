# Technical Decisions - Capture Flag

## Finalized Technical Decisions

| Area | Decision |
|---|---|
| Monorepo | TypeScript + npm workspaces |
| API | NestJS |
| Client | Vite + React |
| Client server state | TanStack React Query |
| Current UI | In-house components with Tailwind CSS v4, lucide-react, and framer-motion |
| Database | PostgreSQL |
| ORM | Prisma |
| Initial auth | GitHub OAuth |
| Client session | HTTP-only cookie |
| SDK/config | In-house SDK + in-house versioned JSON |
| Product model | Multi-tenant SaaS from the start |
| Package scope | `@capture-flag/*` |
| Lint/format | Biome |
| Local infra | Docker Compose |
| Future cache | Redis |
| Tests | Vitest in all workspaces |

## Current Implementation Decisions

| Area | Decision |
|---|---|
| API dev runner | `tsx watch` instead of Nest CLI to keep the initial scaffold smaller |
| GitHub OAuth | Direct implementation with `fetch`, without Passport, to reduce dependencies in Phase 1 |
| Phase 1 client | React + TanStack Query with simple CSS; shadcn/ui/Radix were not adopted in the MVP |
| Client shared core | Reusable helpers and hooks, independent of context, live in `apps/client/src/core/<category>/<name>.ts`; there are no `index.ts` barrels inside `core`, and tests stay in `__tests__` by category |
| SDK JS | `@capture-flag/sdk-js` fetches the public Config JSON, uses memory cache, and evaluates locally |
| Evaluator | Local engine implemented in the `@capture-flag/evaluator` package and integrated into SDK JS |
| Tenant isolation | Centralized in `AccessService`, used by private organization/project routes |
| Segments | Reusable segments are scoped by config, emitted in Config JSON, and evaluated locally by the evaluator/SDK |
| Advanced targeting | Advanced operators and prerequisite flags remain in JSONB and are evaluated locally by the evaluator/SDK |
| Audit logs | Generated automatically by the backend; no required audit field depends on explicit user input |
| RBAC | `AccessService` centralizes tenant access; organization `owner`/`admin` can satisfy project access, `developer` manages flags, and `project_admin` manages project administrative resources |
| Route versioning | Authenticated routes use `/api/v1`; public Config JSON uses `/public-api/v1`; `/health` remains unversioned |
| Public Management API | API tokens are stored only as hashes, have a visible prefix, scopes, revocation, optional expiration, rate limit by IP before authentication, and by token/IP after authentication |
| Security | API uses Helmet for HTTP headers, CORS requires an explicit origin in production, HTTPS is mandatory by default in production with proxy support, and current rate limits are in memory per process |

## Initial Data Model

The full relational breakdown is in [`DATA_MODEL.md`](DATA_MODEL.md).

The initial model must contain only the entities required for the first vertical slice: login, organization, projects, configs, environments, SDK keys, flags, per-environment values, publishable config state, and audit logs.

Modeling notes:

| Decision | Reason |
|---|---|
| `users` and `oauth_accounts` stay separate | A user can have more than one OAuth provider; the platform user must not depend on a single external provider |
| `sessions` is its own entity | HTTP-only cookie must use an opaque token; the database stores only hash, expiration, and revocation |
| `configs` sits between project and flags | A project can have more than one set of flags consumed by different SDKs |
| `sdk_keys` sits outside `projects` | SDK key is per config/environment and must support rotation, revocation, `last_used_at`, and multiple active keys in the future |
| `feature_flag_environment_values` | The name makes clear that the flag value/configuration varies by environment |
| `config_environment_states` | Stores `revision` and `etag` for the `config + environment` pair for HTTP cache from the MVP |
| Rules and percentage rollout start as JSONB | Avoids premature normalization; dedicated tables only come in if the UI/queries require them |
| Audit logs | A flag change in production without a trail is a larger risk than the table cost; Phase 9 evolves audit for filters, old/new/metadata, and member/config publish events |

Tables intentionally outside the initial model:

| Table | Phase | Reason not to enter the MVP |
|---|---|---|
| targeting_rules | Phase 3 | Rules exist in the MVP, but stay in `rules_json`; a dedicated table would be premature normalization |
| percentage_options | Phase 3 | Percentage rollout exists in the MVP, but stays in `percentage_options_json`; a dedicated table only enters if the UI/queries require it |
| organization_invitations | Post-MVP | The MVP adds existing members; email invitation stays for future evolution |
| webhooks | Removed from the MVP | They depend on stable change events |
| api_tokens | Implemented in Phase 13 | Public Management API uses Bearer tokens; client continues using session |

Mandatory requirement: every operational entity must be reachable from `organization_id` directly or indirectly. No read or write query can depend only on global IDs without validating the current tenant.

## Future Decisions

There are no blocking technical decisions for starting Sprint 1.

| Future decision | Ideal timing |
|---|---|
| Add Google OAuth | After the GitHub flow is stable |
| Define cloud provider | Before the first external deploy |
| Define billing strategy | Before resuming post-MVP billing |
| Define whether Redis is mandatory or optional | Before scaling distributed cache/rate limit |
