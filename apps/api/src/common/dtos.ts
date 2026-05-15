import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsEmail,
  IsISO8601,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { apiTokenScopes } from "./api-token-scopes";
import { featureFlagTypes } from "./flag-values";
import { organizationRoles, projectRoles } from "./roles";

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

export class UpdateProjectDto {
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

export class ProjectMemberDto extends MemberTargetDto {
  @ApiProperty({ enum: [...projectRoles] })
  @IsIn(projectRoles)
  role!: string;
}

export class UpdateOrganizationMemberDto {
  @ApiProperty({ enum: [...organizationRoles] })
  @IsIn(organizationRoles)
  role!: string;
}

export class UpdateProjectMemberDto {
  @ApiProperty({ enum: [...projectRoles] })
  @IsIn(projectRoles)
  role!: string;
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

export class CreateEnvironmentDto {
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
}

export class UpdateEnvironmentDto {
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
  key?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
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

export class CreateFeatureFlagDto {
  @ApiProperty({ maxLength: 80, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  key!: string;

  @ApiProperty({ maxLength: 120, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: [...featureFlagTypes] })
  @IsIn(featureFlagTypes)
  type!: string;

  @ApiPropertyOptional({ description: "Initial value matching the feature flag type." })
  @IsOptional()
  defaultValue?: unknown;

  @ApiPropertyOptional({ maxLength: 50, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];

  @ApiPropertyOptional({ maxLength: 500 })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(500)
  hint?: string;

  @ApiPropertyOptional({ format: "uuid", nullable: true })
  @IsOptional()
  @IsUUID()
  ownerUserId?: string | null;
}

export class CreateManagementFeatureFlagDto extends CreateFeatureFlagDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  configId!: string;
}

export class ListManagementFlagsQueryDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  configId!: string;
}

export class ListManagementEnvironmentsQueryDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  projectId!: string;
}

export class UpdateFeatureFlagDto {
  @ApiPropertyOptional({ maxLength: 80, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  key?: string;

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

  @ApiPropertyOptional({ maxLength: 50, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];

  @ApiPropertyOptional({ maxLength: 500 })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(500)
  hint?: string;

  @ApiPropertyOptional({ format: "uuid", nullable: true })
  @IsOptional()
  @IsUUID()
  ownerUserId?: string | null;
}

export class UpdateFeatureFlagEnvironmentValueDto {
  @ApiPropertyOptional({ description: "Default value matching the feature flag type." })
  @IsOptional()
  defaultValue?: unknown;

  @ApiPropertyOptional({ description: "Targeting rules JSON array." })
  @IsOptional()
  rulesJson?: unknown;

  @ApiPropertyOptional({ maxLength: 80, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  percentageAttribute?: string;

  @ApiPropertyOptional({ description: "Percentage rollout options JSON array." })
  @IsOptional()
  percentageOptionsJson?: unknown;
}

export class CreateSegmentDto {
  @ApiProperty({ maxLength: 80, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  key!: string;

  @ApiProperty({ maxLength: 120, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: "Segment condition list evaluated with AND." })
  @IsOptional()
  conditionsJson?: unknown;
}

export class UpdateSegmentDto {
  @ApiPropertyOptional({ maxLength: 80, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  key?: string;

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

  @ApiPropertyOptional({ description: "Segment condition list evaluated with AND." })
  @IsOptional()
  conditionsJson?: unknown;
}

export class ListAuditLogsQueryDto {
  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  configId?: string;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  actorUserId?: string;

  @ApiPropertyOptional({ maxLength: 80, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  entityType?: string;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({ maxLength: 120, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  action?: string;

  @ApiPropertyOptional({ format: "date-time" })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ format: "date-time" })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ maximum: 100, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ maxLength: 500, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  cursor?: string;
}

export class ListFeatureFlagActivityQueryDto {
  @ApiPropertyOptional({ maximum: 100, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ maxLength: 500, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  cursor?: string;
}
