import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

function trimString(value: unknown) {
  return typeof value === "string" ? value.trim() : value;
}

export class CreateConfigDto {
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
  key?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateConfigDto {
  @ApiPropertyOptional({ maxLength: 120, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
