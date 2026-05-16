# API App Architecture

`apps/api` is a NestJS API backed by Prisma and PostgreSQL.

## Request Flow

- Controllers define routes, parse params, receive DTOs, and pass `request.user.id` to services.
- Session-only private controllers use `SessionGuard` and `AuthenticatedRequest`.
- API-token-capable management controllers use `AuthenticatedApiGuard`, then API token tenant/scope guards.
- API-token-only management routes can use `ApiTokenGuard` directly, followed by tenant/scope guards.
- DTO classes validate and normalize request bodies.
- UUID route params use `ParseUUIDPipe` in controllers.
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
