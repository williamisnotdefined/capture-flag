import { Param, ParseUUIDPipe } from "@nestjs/common";

export function UuidParam(paramName: string): ParameterDecorator {
  return Param(paramName, ParseUUIDPipe);
}
