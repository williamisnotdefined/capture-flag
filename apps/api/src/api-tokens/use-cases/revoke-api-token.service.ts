import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ApiTokenAccessService, ApiTokenAuditService, apiTokenSelect } from "../support";

export type RevokeApiTokenInput = {
  apiTokenId: string;
  userId: string;
};

@Injectable()
export class RevokeApiTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiTokenAccess: ApiTokenAccessService,
    private readonly apiTokenAudit: ApiTokenAuditService,
  ) {}

  async execute({ userId, apiTokenId }: RevokeApiTokenInput) {
    const apiToken = await this.apiTokenAccess.findApiTokenForWrite(userId, apiTokenId);

    if (apiToken.revokedAt) {
      throw new BadRequestException("API token is already revoked");
    }

    return this.prisma.$transaction(async (tx) => {
      const revokeResult = await tx.apiToken.updateMany({
        where: { id: apiTokenId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      if (revokeResult.count !== 1) {
        throw new BadRequestException("API token is already revoked");
      }

      const revokedApiToken = await tx.apiToken.findUnique({
        where: { id: apiTokenId },
        select: apiTokenSelect(),
      });
      if (!revokedApiToken) {
        throw new NotFoundException("API token not found");
      }

      await this.apiTokenAudit.writeApiTokenRevoked(tx, {
        actorUserId: userId,
        oldApiToken: apiToken,
        revokedApiToken,
      });

      return revokedApiToken;
    });
  }
}
