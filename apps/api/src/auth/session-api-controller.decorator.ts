import { applyDecorators, Controller, UseGuards } from "@nestjs/common";
import { SessionGuard } from "./session.guard";

export function SessionApiController(path: string): ClassDecorator {
  return applyDecorators(Controller(path), UseGuards(SessionGuard));
}
