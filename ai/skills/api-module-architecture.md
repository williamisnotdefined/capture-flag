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
