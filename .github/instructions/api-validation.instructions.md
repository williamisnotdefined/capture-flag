---
applyTo: "apps/api/**/*.{ts}"
---

Generated from `ai/registry.json`. Do not edit manually.

Canonical skill: `../../ai/skills/api-validation.md`.

Referenced context:
- `../../ai/rules/api-validation-rules.md`
- `../../ai/architecture/api-app.md`
- `../../ai/examples/good-api-validation.md`

This file is compiled from canonical AI knowledge files. Edit canonical files under `ai`, then run `npm run ai:sync`.

# Compiled AI Skill: api-validation

## Canonical Skill: `ai/skills/api-validation.md`

# API Validation

Use this skill when adding or changing API controllers, route params, request DTOs, or validation behavior in `apps/api`.

## Goal

Keep request validation at Nest boundaries while preserving service ownership of authorization, existence checks, and business rules.

## Read First

- `ai/rules/api-validation-rules.md`
- `ai/architecture/api-app.md`
- `ai/examples/good-api-validation.md`

## Workflow

- Inspect nearby controller and DTO patterns before editing.
- Add DTO decorators for request-body shape, format, and normalization.
- Use `ParseUUIDPipe` for UUID route params.
- Keep database-aware and tenant-aware validation in services.
- Preserve shared Prisma exception handling for uniqueness and constraint errors.

## Expected Output

- Controllers parse and delegate.
- DTOs validate and normalize request bodies.
- Services enforce authorization, ownership, existence, and business invariants.

## Verification

- Search controllers for `@Param("` and verify UUID IDs use `ParseUUIDPipe`.
- Check every `@Body()` type is a DTO with validation decorators.
- Run `npm --workspace @capture-flag/api run build`.

# Referenced Context

## Reference: `ai/rules/api-validation-rules.md`

# API Validation Rules

Rules for Nest controllers, DTOs, and request validation in `apps/api`.

## Always

- Keep the global Nest `ValidationPipe` enabled in `src/main.ts`.
- Use DTO classes with `class-validator` decorators for request bodies.
- Use `class-transformer` decorators such as `@Transform` and `@Type` for normalization.
- Use `ParseUUIDPipe` for every UUID route param before passing it into services.
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

- Search controllers for `@Param("` and ensure UUID IDs use `ParseUUIDPipe`.
- Check every `@Body()` type is a DTO with validation decorators.
- Run `npm --workspace @capture-flag/api run build` after API validation changes.

## Reference: `ai/architecture/api-app.md`

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

## Reference: `ai/examples/good-api-validation.md`

# Good API Validation

Source: `apps/api/src/feature-flags/feature-flags.controller.ts` (sha256: `52d7ef030580f0085a1f757e54c2f35622221c2fcb3871d141d22ebbccec0803`)
Source: `apps/api/src/common/dtos.ts` (sha256: `2d442cb3c7eff89d1b169195f4ebe2a924b91aa952cda3a0ea0849b9d5303438`)

Why this is canonical:

- Keeps controllers thin by parsing params and passing authenticated user identity.
- Uses `ParseUUIDPipe` at controller boundaries.
- Leaves database-aware validation and ownership checks in services.

Canonical controller and DTO patterns from `apps/api`.

## Controller Param Validation

```ts
@Get("configs/:configId/feature-flags")
list(@Req() request: AuthenticatedRequest, @Param("configId", ParseUUIDPipe) configId: string) {
  return this.featureFlags.list(request.user.id, configId);
}
```

Controllers parse UUID params and pass authenticated user identity to services.

## DTO Normalization

```ts
export class CreateProjectDto {
  @ApiProperty({ maxLength: 120, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ maxLength: 80, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  slug?: string;
}
```

DTOs normalize strings before validation and keep database-aware rules in services.
