import { Controller, UseGuards, applyDecorators } from "@nestjs/common";
import { SessionGuard } from "./session.guard";

export function SessionApiController(path: string): ClassDecorator {
  return applyDecorators(Controller(path), UseGuards(SessionGuard));
}
