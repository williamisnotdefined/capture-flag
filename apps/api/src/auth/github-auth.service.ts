import { randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { GithubOAuthConfigService } from "./github-oauth-config.service";
import { AuthenticateGithubCodeService } from "./use-cases";

@Injectable()
export class GithubAuthService {
  constructor(
    private readonly config: GithubOAuthConfigService,
    private readonly authenticateGithubCode: AuthenticateGithubCodeService,
  ) {}

  createState(): string {
    return randomBytes(24).toString("base64url");
  }

  getAuthorizationUrl(state: string): string {
    return this.config.getAuthorizationUrl(state);
  }

  async authenticate(code: string) {
    return this.authenticateGithubCode.execute(code);
  }
}
