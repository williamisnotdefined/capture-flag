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
