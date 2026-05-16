import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";
import { organizationRoles } from "../../common/roles";

function trimString(value: unknown) {
  return typeof value === "string" ? value.trim() : value;
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : value;
}

class MemberTargetDto {
  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ format: "email", maxLength: 254 })
  @Transform(({ value }) => normalizeEmail(value))
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;
}

export class CreateOrganizationDto {
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

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ maxLength: 120, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ maxLength: 80, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  slug?: string;
}

export class OrganizationMemberDto extends MemberTargetDto {
  @ApiProperty({ enum: [...organizationRoles] })
  @IsIn(organizationRoles)
  role!: string;
}

export class UpdateOrganizationMemberDto {
  @ApiProperty({ enum: [...organizationRoles] })
  @IsIn(organizationRoles)
  role!: string;
}
