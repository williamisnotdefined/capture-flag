# Good API Validation

Source: `apps/api/src/feature-flags/feature-flags.controller.ts` (sha256: `744b9c3c262234854a993aaf59bc8290df1dbfeec6ddee49afaf2fb5916e45c9`)
Source: `apps/api/src/common/dtos.ts` (sha256: `8b602d7df0de7e5c106d7ffdea7969e0c5d5f2e514b7db2982e3504f19312ef7`)

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
