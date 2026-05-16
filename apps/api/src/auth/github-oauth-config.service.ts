import { Injectable, InternalServerErrorException } from "@nestjs/common";

const githubOAuthScope = "read:user user:email";

@Injectable()
export class GithubOAuthConfigService {
  get clientId(): string {
    return this.getRequiredEnv("GITHUB_CLIENT_ID");
  }

  get clientSecret(): string {
    return this.getRequiredEnv("GITHUB_CLIENT_SECRET");
  }

  get callbackUrl(): string {
    return `${process.env.API_BASE_URL ?? "http://localhost:3000"}/api/v1/auth/github/callback`;
  }

  getAuthorizationUrl(state: string): string {
    const url = new URL("https://github.com/login/oauth/authorize");

    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("redirect_uri", this.callbackUrl);
    url.searchParams.set("scope", githubOAuthScope);
    url.searchParams.set("state", state);

    return url.toString();
  }

  private getRequiredEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
      throw new InternalServerErrorException(`${name} is required`);
    }

    return value;
  }
}
