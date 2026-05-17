---
applyTo: "apps/api/src/**/*.ts,apps/api/test/**/*.ts"
---

Generated from `ai/registry.json`. Do not edit manually.

Canonical skill: `../../ai/skills/api-module-architecture.md`.

Referenced context:
- `../../ai/rules/api-module-rules.md`
- `../../ai/rules/api-validation-rules.md`
- `../../ai/rules/api-tenant-access-rules.md`
- `../../ai/architecture/api-app.md`
- `../../ai/architecture/api-module-patterns.md`
- `../../ai/examples/good-api-module-structure.md`

This file is compiled from canonical AI knowledge files. Edit canonical files under `ai`, then run `npm run ai:sync`.

# Compiled AI Skill: api-module-architecture

## Canonical Skill: `ai/skills/api-module-architecture.md`

# API Module Architecture

Use this skill when changing API module structure, controllers, facade services, use cases, support services, providers, or exports in `apps/api`.

## Goal

Keep API modules small, explicit, tenant-safe, and aligned with the controller, facade, use-case, support, and Nest module boundaries used in this repository.

## Read First

- `ai/rules/api-module-rules.md`
- `ai/rules/api-validation-rules.md`
- `ai/rules/api-tenant-access-rules.md`
- `ai/architecture/api-app.md`
- `ai/architecture/api-module-patterns.md`
- `ai/examples/good-api-module-structure.md`

## Related References

- Use `api-validation` when route params, DTOs, or request validation change.
- Use `api-tenant-access` when the refactor touches authorization, ownership, or tenant-scoped Prisma paths.
- Use `config-state-audit` when the refactor touches revisions, ETags, config environment state, or audit logs.
- Use `api-public-management` when the refactor touches API-token guards, scopes, tenant decorators, or management OpenAPI.

## Workflow

- Identify the current module boundary and whether the controller should delegate to a facade service or directly to focused use cases.
- Keep controllers limited to route declarations, decorators, validated params/body/query, authenticated identity, and delegation.
- Keep use cases responsible for operation behavior, access checks, Prisma, transactions, no-op handling, and side effects.
- Extract support services only for concrete responsibilities that remove real complexity from use cases.
- Keep Nest module imports, providers, controllers, and exports explicit and minimal.
- Check tests around the changed behavior before deciding whether a refactor is safe without new coverage.

## Expected Output

- Controllers stay thin and do not own business rules.
- Facade services, when present, are delegation boundaries rather than large domain services.
- Use cases and support services have clear responsibilities.
- Module exports expose only the boundary needed by other modules.
- Tenant, credential, audit, and config-state invariants remain unchanged by structural refactors.

## Verification

- Inspect changed controllers for parsing/delegation only.
- Inspect changed modules for provider/import/export correctness.
- Run `npm --workspace @capture-flag/api run test` after behavior-sensitive refactors.
- Run `npm --workspace @capture-flag/api run build` after module, controller, or service changes.

# Referenced Context

## Reference: `ai/rules/api-module-rules.md`

# API Module Rules

Rules for Nest module structure, controllers, facade services, use cases, and support services in `apps/api`.

## Always

- Keep controllers thin: parse route params, query, and body data, read authenticated identity, and delegate immediately.
- Use existing boundary decorators such as `CurrentUserId`, `UuidParam`, `SessionApiController`, and `SessionOrApiTokenController` before adding new request helpers.
- Put business behavior, Prisma reads/writes, authorization, ownership checks, transactions, and side effects in use-case services or domain services.
- Use facade services only as module boundaries for controllers or cross-module exports; facade methods should delegate to use cases and stay free of domain rules.
- Put reusable module collaborators in `support` with concrete responsibilities such as access, audit, input normalization, read models, credentials, config state, references, validation, writers, or initializers.
- Keep support services named after the responsibility they own, not a generic utility category.
- Register controllers, facade services, use cases, guards, and support services explicitly in the Nest module providers list.
- Export only the module boundary needed by another module, such as a facade service or guard; keep internal use cases and support providers private by default.
- Keep audited writes and config-state bumps inside the same transaction as the mutation they describe.
- Add or update behavior tests when refactoring responsibilities that affect tenant access, credentials, audit, config state, public config, or API-token behavior.

## Never

- Do not inject `PrismaService`, `AccessService`, audit helpers, config-state helpers, token hashing, or SDK-key hashing directly into controllers.
- Do not put tenant checks, RBAC decisions, Prisma queries, or domain invariants in controllers.
- Do not turn facade services into large domain services when focused use cases would keep responsibilities smaller.
- Do not create generic base services, abstract repositories, or compatibility layers without a concrete repeated pattern in nearby API code.
- Do not export support providers from a module unless there is a current cross-module consumer that needs that exact provider.
- Do not split a small use case just to add indirection; extract only when it removes a real responsibility from an overgrown service.

## Verification

- Inspect changed controllers and verify they only parse/delegate.
- Inspect changed modules and verify provider/import/export wiring is explicit and minimal.
- Search changed use cases for tenant-owned Prisma reads or writes and verify ownership/access checks happen first.
- Run `npm --workspace @capture-flag/api run test` after behavior-sensitive API refactors.
- Run `npm --workspace @capture-flag/api run build` after module, provider, controller, or service changes.

## Reference: `ai/rules/api-validation-rules.md`

# API Validation Rules

Rules for Nest controllers, DTOs, and request validation in `apps/api`.

## Always

- Keep the global Nest `ValidationPipe` enabled in `src/main.ts`.
- Use DTO classes with `class-validator` decorators for request bodies.
- Use `class-transformer` decorators such as `@Transform` and `@Type` for normalization.
- Use `UuidParam`, the shared wrapper around `ParseUUIDPipe`, for every UUID route param before passing it into services.
- Trim user-entered strings with `@Transform` before validating.
- Pair optional string identifiers with specific validators such as `@IsUUID()` or `@IsEmail()`.
- Use role allowlists with `@IsIn(...)` and shared role constants.
- Keep authorization, existence checks, ownership checks, and business rules in services.

## Never

- Do not accept raw `string` params for IDs backed by Prisma `@db.Uuid` fields.
- Do not put business rules into DTO decorators when they require database context.
- Do not let controllers perform tenant ownership checks.
- Do not bypass the shared Prisma exception filter for mapped uniqueness and constraint errors.
- Do not accept unvalidated request bodies into services.

## Verification

- Search controllers for UUID route params and ensure they use `UuidParam` instead of raw string params.
- Check every `@Body()` type is a DTO with validation decorators.
- Run `npm --workspace @capture-flag/api run build` after API validation changes.

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

## Reference: `ai/architecture/api-module-patterns.md`

# API Module Patterns

`apps/api` uses Nest modules with explicit providers and small service boundaries.

## Standard Shape

```txt
<domain>/
  <domain>.controller.ts
  <domain>.service.ts
  <domain>.module.ts
  dto/
  use-cases/
  support/
```

Not every module needs every folder. Add a folder only when there is a current responsibility for it.

## Request Flow

1. Controller receives an HTTP request through session or API-token guards.
2. Controller validates UUID params with `UuidParam`, receives DTO/query classes, reads `CurrentUserId`, and delegates.
3. Facade service, when present, maps controller-friendly method names to use-case `execute()` calls.
4. Use-case service owns the operation: access checks, ownership resolution, Prisma calls, transactions, domain rules, and side effects.
5. Support services hold focused reusable pieces used by one or more use cases.

## Controller Boundary

Controllers should remain boring. They should not know how tenant access, Prisma queries, audit logs, config revisions, SDK-key hashing, or API-token hashing work.

Acceptable controller work:

- route declarations;
- auth, tenant, and scope decorators;
- `UuidParam`, `CurrentUserId`, `Body`, and `Query` extraction;
- delegation to a facade or use-case service.

## Facade Services

A facade service such as `ProjectsService` or `ConfigsService` is useful when the module exports a stable API or when the controller would otherwise inject many use cases directly.

Facade services should:

- expose concise methods for controller calls;
- delegate to one use-case service per operation;
- keep input types narrow and local;
- avoid Prisma, access checks, audit writes, and transaction logic.

Direct use-case injection in a controller is also acceptable when the controller remains thin and the module does not need a facade boundary.

## Use Cases

Use-case services in `use-cases` represent user-visible or API-visible operations. They are the normal home for Prisma reads/writes, authorization, ownership checks, transactions, no-op handling, audit writes, config-state bumps, and read model selection.

Prefer one `execute()` entry point per use case unless nearby code already uses another shape.

## Support Services

Support services in `support` should own one concrete responsibility that is reused or worth isolating from the use case.

Common responsibilities:

- `AccessService` wrappers for domain-specific ownership resolution;
- audit payload builders and lifecycle writers;
- input normalization and domain validation;
- read model selects and response mapping;
- credential creation and hashing;
- config-state bump orchestration;
- reference checks for segment or prerequisite dependencies;
- writers or initializers that keep transaction bodies readable.

Do not extract a support service only to move one obvious line out of a use case.

## Nest Module Wiring

Modules should declare their imports, controllers, providers, and exports explicitly. Keep internal providers private unless another module currently needs them.

Use module imports for real Nest dependencies, not to reach into another module's private support services.

## Reference: `ai/examples/good-api-module-structure.md`

# Good API Module Structure

Source: `apps/api/src/projects/projects.controller.ts` (sha256: `1a81390937f3ed3f00c344377fc8858826227237732a4c9b910ba7f94a19723e`)
Source: `apps/api/src/projects/projects.service.ts` (sha256: `baa9858a86c5899374774b72ba7cfb7afbb95e678460b5ce472105592778ccec`)
Source: `apps/api/src/projects/projects.module.ts` (sha256: `1b5e81eefa3a22df991ce941803fd1af6e88959c5372c34a9c9418a9ff34b747`)
Source: `apps/api/src/projects/use-cases/create-project.service.ts` (sha256: `630ab9ddd6c6a9d768e60efc436fe847a18de094a99afffeb74b82f1adc00a7a`)
Source: `apps/api/src/projects/support/project-audit.service.ts` (sha256: `6b85227686e8f9d8fe5e3b207faedd11faceb7508a66dcc826f6542603c784a2`)

Why this is canonical:

- Keeps the controller focused on decorators, params, identity, DTOs, and delegation.
- Keeps the facade service as a stable module boundary that delegates to operation-specific use cases.
- Keeps the use case responsible for access, transaction, Prisma writes, bootstrap side effects, and audit writes.
- Keeps audit payload shaping in a focused support service.
- Registers providers explicitly and exports only the module facade.

## Thin Controller

```ts
@Get("organizations/:organizationId/projects")
listForOrganization(
  @CurrentUserId() userId: string,
  @UuidParam("organizationId") organizationId: string,
) {
  return this.projects.listForOrganization(userId, organizationId);
}
```

The controller parses the route and authenticated user, then delegates.

## Facade Boundary

```ts
listForOrganization(userId: string, organizationId: string) {
  return this.listOrganizationProjects.execute({ userId, organizationId });
}
```

The facade exposes controller-friendly methods while use cases own behavior.

## Use Case Ownership

```ts
await this.access.requireOrganizationRole(userId, organizationId, organizationManagerRoles);

return this.prisma.$transaction(async (tx) => {
  const project = await tx.project.create({
    data: {
      organizationId,
      name,
      slug,
    },
  });
});
```

The use case resolves authorization before tenant-owned writes and keeps related writes in a transaction.

## Support Responsibility

```ts
configAuditValue(config: {
  description?: string | null;
  id: string;
  key: string;
  name: string;
  projectId: string;
}) {
  return toAuditJson({
    description: config.description ?? null,
    id: config.id,
    key: config.key,
    name: config.name,
    projectId: config.projectId,
  });
}
```

The support service owns sanitized audit value shaping instead of spreading payload details across use cases.

## Module Wiring

```ts
@Module({
  imports: [CommonModule, ApiTokensModule],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    ProjectAuditService,
    ProjectMemberTargetService,
    ListOrganizationProjectsService,
    CreateProjectService,
  ],
  exports: [ProjectsService],
})
export class ProjectsModule {}
```

The module declares internal providers explicitly and exports only the facade boundary.
