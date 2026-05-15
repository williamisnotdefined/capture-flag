# Good API Validation

Source: `apps/api/src/feature-flags/feature-flags.controller.ts` (sha256: `4098dafa8b9536d077eb9fe057b810d69b6db80e2d58aae9fb3e77132bdca663`)
Source: `apps/api/src/common/dtos.ts` (sha256: `55f52e85b5facedd4de5f1442085f550ee9975c57a67884a8b8bcf34b1c65ad2`)

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
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  slug?: string;
}
```

DTOs normalize strings before validation and keep database-aware rules in services.
