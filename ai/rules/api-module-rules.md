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
