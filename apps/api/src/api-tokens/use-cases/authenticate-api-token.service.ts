import { Injectable } from "@nestjs/common";
import { hashApiToken } from "../../common/api-token-crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { apiTokenAuthenticationSelect } from "../support";

export type AuthenticateApiTokenInput = {
  rawToken: string;
};

@Injectable()
export class AuthenticateApiTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ rawToken }: AuthenticateApiTokenInput) {
    const apiToken = await this.prisma.apiToken.findUnique({
      where: { tokenHash: hashApiToken(rawToken) },
      select: apiTokenAuthenticationSelect(),
    });

    if (
      !apiToken ||
      apiToken.revokedAt ||
      apiToken.organization?.deletedAt ||
      apiToken.project?.deletedAt ||
      this.isExpired(apiToken.expiresAt)
    ) {
      return null;
    }

    await this.markUsed(apiToken.id);

    const { organization: _organization, project: _project, ...authenticatedApiToken } = apiToken;

    return authenticatedApiToken;
  }

  private isExpired(expiresAt: Date | null) {
    return Boolean(expiresAt && expiresAt <= new Date());
  }

  private async markUsed(apiTokenId: string) {
    try {
      await this.prisma.apiToken.update({
        where: { id: apiTokenId },
        data: { lastUsedAt: new Date() },
      });
    } catch {
      return;
    }
  }
}
