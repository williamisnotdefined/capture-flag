# Good API Validation

Source: `apps/api/src/feature-flags/feature-flags.controller.ts` (sha256: `1949c60371de22bf12e05ef4e366708dc2c7adfb69027c12f50516f741152f07`)
Source: `apps/api/src/projects/dto/projects.dto.ts` (sha256: `8ba57f5fea22889c71de3571a4285309d127ceecfa8b7527b215dbf9e432508b`)

Why this is canonical:

- Keeps controllers thin by parsing params and passing authenticated user identity.
- Uses `UuidParam`, a small wrapper around `ParseUUIDPipe`, at controller boundaries.
- Leaves database-aware validation and ownership checks in services.

Canonical controller and colocated DTO patterns from `apps/api`.

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
