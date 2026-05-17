import { BadRequestException, Injectable } from "@nestjs/common";
import { GithubOAuthConfigService } from "./github-oauth-config.service";

type GithubTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

export type GithubUserResponse = {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
};

type GithubEmailResponse = {
  email: string;
  primary: boolean;
  verified: boolean;
};

@Injectable()
export class GithubOAuthClientService {
  constructor(private readonly config: GithubOAuthConfigService) {}

  async exchangeCode(code: string): Promise<string> {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: this.config.callbackUrl,
      }),
    });

    const payload = (await response.json()) as GithubTokenResponse;

    if (!response.ok || !payload.access_token) {
      throw new BadRequestException(
        payload.error_description ?? payload.error ?? "GitHub OAuth failed",
      );
    }

    return payload.access_token;
  }

  async fetchGitHubUser(accessToken: string): Promise<GithubUserResponse> {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      throw new BadRequestException("Could not fetch GitHub user");
    }

    return response.json() as Promise<GithubUserResponse>;
  }

  async fetchPrimaryEmail(accessToken: string): Promise<string | null> {
    const response = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      throw new BadRequestException("GitHub email permission is required");
    }

    const emails = (await response.json()) as GithubEmailResponse[];
    return emails.find((email) => email.primary && email.verified)?.email ?? null;
  }
}
