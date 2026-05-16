import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsArray,
  IsISO8601,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";
import { apiTokenScopes } from "../../common/api-token-scopes";

function trimString(value: unknown) {
  return typeof value === "string" ? value.trim() : value;
}

export class CreateApiTokenDto {
  @ApiProperty({ maxLength: 120, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: [...apiTokenScopes], isArray: true })
  @IsArray()
  @IsIn(apiTokenScopes, { each: true })
  scopes!: string[];

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ format: "date-time" })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}
