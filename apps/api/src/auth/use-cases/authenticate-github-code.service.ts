import { Injectable } from "@nestjs/common";
import { GithubOAuthClientService } from "../github-oauth-client.service";
import { GithubUserProvisioningService } from "../github-user-provisioning.service";

@Injectable()
export class AuthenticateGithubCodeService {
  constructor(
    private readonly githubClient: GithubOAuthClientService,
    private readonly githubUserProvisioning: GithubUserProvisioningService,
  ) {}

  async execute(code: string) {
    const accessToken = await this.githubClient.exchangeCode(code);
    const githubUser = await this.githubClient.fetchGitHubUser(accessToken);
    const email = await this.githubClient.fetchPrimaryEmail(accessToken);

    return this.githubUserProvisioning.upsertUser({
      providerUserId: String(githubUser.id),
      name: githubUser.name ?? githubUser.login,
      email,
    });
  }
}
