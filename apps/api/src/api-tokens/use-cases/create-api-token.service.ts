import { BadRequestException, Injectable } from "@nestjs/common";
import { createRawApiToken, hashApiToken } from "../../common/api-token-crypto";
import { isApiTokenScope } from "../../common/api-token-scopes";
import { createAuditLog, toAuditJson } from "../../common/audit-log";
import { PrismaService } from "../../prisma/prisma.service";
import { ApiTokenAccessService, ApiTokenAuditService, apiTokenSelect } from "../support";

export type CreateApiTokenInput = {
  input: {
    expiresAt?: string;
    name?: string;
    projectId?: string;
    scopes?: string[];
  };
  organizationId: string;
  userId: string;
};

@Injectable()
export class CreateApiTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiTokenAccess: ApiTokenAccessService,
    private readonly apiTokenAudit: ApiTokenAuditService,
  ) {}

  async execute({ userId, organizationId, input }: CreateApiTokenInput) {
    await this.apiTokenAccess.requireOrganizationWrite(userId, organizationId);

    const name = input.name?.trim();
    if (!name) {
      throw new BadRequestException("API token name is required");
    }

    const scopes = this.normalizeScopes(input.scopes);
    const expiresAt = this.normalizeExpiresAt(input.expiresAt);
    const projectId = await this.apiTokenAccess.normalizeProjectId(organizationId, input.projectId);

    const rawToken = createRawApiToken();
    const tokenPrefix = rawToken.slice(0, 18);
    const tokenHash = hashApiToken(rawToken);

    return this.prisma.$transaction(async (tx) => {
      const apiToken = await tx.apiToken.create({
        data: {
          organizationId,
          projectId,
          userId,
          name,
          tokenPrefix,
          tokenHash,
          scopes,
          expiresAt,
        },
        select: apiTokenSelect(),
      });

      await createAuditLog(tx, {
        action: "api_token.created",
        actorUserId: userId,
        entityId: apiToken.id,
        entityType: "api_token",
        metadata: toAuditJson({ projectId, scopes, tokenPrefix }),
        newValue: this.apiTokenAudit.apiTokenAuditValue(apiToken),
        organizationId,
        projectId,
      });

      return {
        ...apiToken,
        token: rawToken,
      };
    });
  }

  private normalizeScopes(scopes: string[] | undefined) {
    const normalizedScopes = [...new Set(scopes ?? [])];
    if (normalizedScopes.length === 0) {
      throw new BadRequestException("At least one API token scope is required");
    }

    for (const scope of normalizedScopes) {
      if (!isApiTokenScope(scope)) {
        throw new BadRequestException("API token scope is invalid");
      }
    }

    return normalizedScopes;
  }

  private normalizeExpiresAt(value: string | undefined) {
    if (!value) {
      return null;
    }

    const expiresAt = new Date(value);
    if (Number.isNaN(expiresAt.getTime())) {
      throw new BadRequestException("API token expiration is invalid");
    }

    if (expiresAt <= new Date()) {
      throw new BadRequestException("API token expiration must be in the future");
    }

    return expiresAt;
  }
}
