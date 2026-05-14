# Good API Validation

Source: `apps/api/src/feature-flags/feature-flags.controller.ts` (sha256: `5337670953268d03ff6a35d3d6de62d0ef09131ac01412084717e77cb4abbcab`)
Source: `apps/api/src/common/dtos.ts` (sha256: `94f2d8f00eb86821ee8597056623738b35b2d6a956328574044fcfe07d07222c`)

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
