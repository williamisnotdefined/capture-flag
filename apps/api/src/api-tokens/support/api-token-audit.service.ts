import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createAuditLog, toAuditJson } from "../../common/audit-log";

type ApiTokenAuditValueInput = {
  expiresAt?: Date | null;
  id: string;
  lastUsedAt?: Date | null;
  name: string;
  organizationId: string;
  projectId?: string | null;
  revokedAt?: Date | null;
  scopes: string[];
  tokenPrefix: string;
  userId: string;
};

@Injectable()
export class ApiTokenAuditService {
  async writeApiTokenCreated(
    tx: Prisma.TransactionClient,
    input: {
      actorUserId: string;
      apiToken: ApiTokenAuditValueInput;
    },
  ) {
    await createAuditLog(tx, {
      action: "api_token.created",
      actorUserId: input.actorUserId,
      entityId: input.apiToken.id,
      entityType: "api_token",
      metadata: this.apiTokenAuditMetadata(input.apiToken),
      newValue: this.apiTokenAuditValue(input.apiToken),
      organizationId: input.apiToken.organizationId,
      projectId: input.apiToken.projectId ?? null,
    });
  }

  async writeApiTokenRevoked(
    tx: Prisma.TransactionClient,
    input: {
      actorUserId: string;
      oldApiToken: ApiTokenAuditValueInput;
      revokedApiToken: ApiTokenAuditValueInput;
    },
  ) {
    await createAuditLog(tx, {
      action: "api_token.revoked",
      actorUserId: input.actorUserId,
      entityId: input.oldApiToken.id,
      entityType: "api_token",
      metadata: this.apiTokenAuditMetadata(input.oldApiToken),
      newValue: this.apiTokenAuditValue(input.revokedApiToken),
      oldValue: this.apiTokenAuditValue(input.oldApiToken),
      organizationId: input.oldApiToken.organizationId,
      projectId: input.oldApiToken.projectId ?? null,
    });
  }

  apiTokenAuditValue(apiToken: ApiTokenAuditValueInput) {
    return toAuditJson({
      expiresAt: apiToken.expiresAt?.toISOString() ?? null,
      id: apiToken.id,
      lastUsedAt: apiToken.lastUsedAt?.toISOString() ?? null,
      name: apiToken.name,
      organizationId: apiToken.organizationId,
      projectId: apiToken.projectId ?? null,
      revokedAt: apiToken.revokedAt?.toISOString() ?? null,
      scopes: apiToken.scopes,
      tokenPrefix: apiToken.tokenPrefix,
      userId: apiToken.userId,
    });
  }

  private apiTokenAuditMetadata(apiToken: ApiTokenAuditValueInput) {
    return toAuditJson({
      projectId: apiToken.projectId ?? null,
      scopes: apiToken.scopes,
      tokenPrefix: apiToken.tokenPrefix,
    });
  }
}
