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
