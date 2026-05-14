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
