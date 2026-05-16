import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

function trimString(value: unknown) {
  return typeof value === "string" ? value.trim() : value;
}

export class CreateSdkKeyDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  configId!: string;

  @ApiProperty({ format: "uuid" })
  @IsUUID()
  environmentId!: string;

  @ApiPropertyOptional({ maxLength: 120, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;
}
