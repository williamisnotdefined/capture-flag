import { ApiProperty } from "@nestjs/swagger";
import { ArrayMaxSize, ArrayNotEmpty, ArrayUnique, IsArray, IsUUID } from "class-validator";

export class BulkIdsDto {
  @ApiProperty({ format: "uuid", isArray: true, maxItems: 100, minItems: 1 })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID("4", { each: true })
  ids!: string[];
}
