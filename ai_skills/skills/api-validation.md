# API Validation

Use this skill when adding or changing API controllers, route params, request DTOs, or validation behavior in `apps/api`.

## Rules

- Keep the global Nest `ValidationPipe` enabled in `src/main.ts`.
- Use DTO classes with `class-validator` decorators for request bodies.
- Use `class-transformer` decorators such as `@Transform` and `@Type` for request normalization.
- Use `ParseUUIDPipe` for every UUID route param before passing it into services.
- Do not accept raw `string` params for IDs backed by Prisma `@db.Uuid` fields.
- Validate field formats in DTOs and enforce mutually exclusive member targets before lookup in services.
- Keep authorization, existence checks, ownership checks, and business rules in services.
- Keep Prisma uniqueness and constraint errors mapped through the shared exception filter.

## DTO Convention

- Trim user-entered strings with `@Transform` before validating.
- Use `@IsOptional()` only when a missing value is valid.
- Pair optional string identifiers with specific validators such as `@IsUUID()` or `@IsEmail()`.
- Use role allowlists with `@IsIn(...)` and shared role constants.
- Use `@Type(() => Number)` before numeric validators on transformed input.

## Controller Convention

```ts
@Get("projects/:projectId")
get(
  @Req() request: AuthenticatedRequest,
  @Param("projectId", ParseUUIDPipe) projectId: string,
) {
  return this.projects.get(request.user.id, projectId);
}
```

## Verification

- Search for `@Param("` in controllers and ensure UUID IDs use `ParseUUIDPipe`.
- Check that every `@Body()` type is a DTO with validation decorators.
- Run `npm --workspace @capture-flag/api run build` after API validation changes.
