import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";
import { CreateFeatureFlagDto } from "../../feature-flags/dto";

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
