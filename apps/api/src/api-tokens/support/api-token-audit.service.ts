import { Injectable } from "@nestjs/common";
import { toAuditJson } from "../../common/audit-log";

@Injectable()
export class ApiTokenAuditService {
  apiTokenAuditValue(apiToken: {
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
  }) {
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
}
