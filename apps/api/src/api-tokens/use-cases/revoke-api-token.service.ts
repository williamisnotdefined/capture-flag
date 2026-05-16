import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { createAuditLog, toAuditJson } from "../../common/audit-log";
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

      await createAuditLog(tx, {
        action: "api_token.revoked",
        actorUserId: userId,
        entityId: apiTokenId,
        entityType: "api_token",
        metadata: toAuditJson({
          projectId: apiToken.projectId,
          scopes: apiToken.scopes,
          tokenPrefix: apiToken.tokenPrefix,
        }),
        newValue: this.apiTokenAudit.apiTokenAuditValue(revokedApiToken),
        oldValue: this.apiTokenAudit.apiTokenAuditValue(apiToken),
        organizationId: apiToken.organizationId,
        projectId: apiToken.projectId,
      });

      return revokedApiToken;
    });
  }
}
