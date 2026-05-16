# Good API Validation

Source: `apps/api/src/feature-flags/feature-flags.controller.ts` (sha256: `fb3a82bb18c33488e6bcbcdbf84ca245303c5291c2a89bd0b7a856bc26e6ef5c`)
Source: `apps/api/src/common/dtos.ts` (sha256: `2d442cb3c7eff89d1b169195f4ebe2a924b91aa952cda3a0ea0849b9d5303438`)

Why this is canonical:

- Keeps controllers thin by parsing params and passing authenticated user identity.
- Uses `UuidParam`, a small wrapper around `ParseUUIDPipe`, at controller boundaries.
- Leaves database-aware validation and ownership checks in services.

Canonical controller and DTO patterns from `apps/api`.

## Controller Param Validation

```ts
@Get("configs/:configId/feature-flags")
list(@CurrentUserId() userId: string, @UuidParam("configId") configId: string) {
  return this.listFeatureFlags.execute({ userId, configId });
}
```

Controllers parse UUID params and pass authenticated user identity to use-case services.

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
