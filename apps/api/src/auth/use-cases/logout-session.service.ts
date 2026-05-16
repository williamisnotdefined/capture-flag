import { Injectable } from "@nestjs/common";
import { SessionsService } from "../sessions.service";

export type LogoutSessionInput = {
  token?: string;
};

@Injectable()
export class LogoutSessionService {
  constructor(private readonly sessions: SessionsService) {}

  async execute({ token }: LogoutSessionInput) {
    if (token) {
      await this.sessions.revokeToken(token);
    }

    return { ok: true };
  }
}
