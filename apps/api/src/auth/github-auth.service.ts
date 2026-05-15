import { randomBytes } from "node:crypto";
import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

type GitHubTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GitHubUserResponse = {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type GitHubEmailResponse = {
  email: string;
  primary: boolean;
  verified: boolean;
};

@Injectable()
export class GithubAuthService {
  constructor(private readonly prisma: PrismaService) {}

  createState(): string {
    return randomBytes(24).toString("base64url");
  }

  getAuthorizationUrl(state: string): string {
    const clientId = this.getRequiredEnv("GITHUB_CLIENT_ID");
    const redirectUri = this.callbackUrl;
    const url = new URL("https://github.com/login/oauth/authorize");

    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", "read:user user:email");
    url.searchParams.set("state", state);

    return url.toString();
  }

  async authenticate(code: string) {
    const accessToken = await this.exchangeCode(code);
    const githubUser = await this.fetchGitHubUser(accessToken);
    const rawEmail = await this.fetchPrimaryEmail(accessToken);
    const email = rawEmail?.trim().toLowerCase() ?? null;

    return this.upsertUser({
      providerUserId: String(githubUser.id),
      name: githubUser.name ?? githubUser.login,
      email,
      avatarUrl: githubUser.avatar_url,
    });
  }

  private async exchangeCode(code: string): Promise<string> {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: this.getRequiredEnv("GITHUB_CLIENT_ID"),
        client_secret: this.getRequiredEnv("GITHUB_CLIENT_SECRET"),
        code,
        redirect_uri: this.callbackUrl,
      }),
    });

    const payload = (await response.json()) as GitHubTokenResponse;

    if (!response.ok || !payload.access_token) {
      throw new BadRequestException(
        payload.error_description ?? payload.error ?? "GitHub OAuth failed",
      );
    }

    return payload.access_token;
  }

  private async fetchGitHubUser(accessToken: string): Promise<GitHubUserResponse> {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      throw new BadRequestException("Could not fetch GitHub user");
    }

    return response.json() as Promise<GitHubUserResponse>;
  }

  private async fetchPrimaryEmail(accessToken: string): Promise<string | null> {
    const response = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const emails = (await response.json()) as GitHubEmailResponse[];
    return emails.find((email) => email.primary && email.verified)?.email ?? null;
  }

  private async upsertUser(input: {
    providerUserId: string;
    name: string;
    email: string | null;
    avatarUrl: string | null;
  }) {
    const existingAccount = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider: "github",
          providerUserId: input.providerUserId,
        },
      },
      include: {
        user: true,
      },
    });

    if (existingAccount) {
      return this.prisma.user.update({
        where: { id: existingAccount.userId },
        data: {
          name: input.name,
          ...(input.email ? { email: input.email } : {}),
          avatarUrl: input.avatarUrl,
        },
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const user = input.email
        ? await tx.user.upsert({
            where: { email: input.email },
            create: {
              name: input.name,
              email: input.email,
              avatarUrl: input.avatarUrl,
            },
            update: {
              name: input.name,
              avatarUrl: input.avatarUrl,
            },
          })
        : await tx.user.create({
            data: {
              name: input.name,
              email: null,
              avatarUrl: input.avatarUrl,
            },
          });

      await tx.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: "github",
          providerUserId: input.providerUserId,
          providerEmail: input.email,
        },
      });

      return user;
    });
  }

  private get callbackUrl(): string {
    return `${process.env.API_BASE_URL ?? "http://localhost:3000"}/api/v1/auth/github/callback`;
  }

  private getRequiredEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
      throw new InternalServerErrorException(`${name} is required`);
    }

    return value;
  }
}
