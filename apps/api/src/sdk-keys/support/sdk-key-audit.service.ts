import { Injectable } from "@nestjs/common";
import { toAuditJson } from "../../common/audit-log";

@Injectable()
export class SdkKeyAuditService {
  sdkKeyAuditValue(sdkKey: {
    configId: string;
    environmentId: string;
    id: string;
    keyPrefix: string;
    lastUsedAt?: Date | null;
    name: string;
    projectId: string;
    revokedAt?: Date | null;
  }) {
    return toAuditJson({
      configId: sdkKey.configId,
      environmentId: sdkKey.environmentId,
      id: sdkKey.id,
      keyPrefix: sdkKey.keyPrefix,
      lastUsedAt: sdkKey.lastUsedAt?.toISOString() ?? null,
      name: sdkKey.name,
      projectId: sdkKey.projectId,
      revokedAt: sdkKey.revokedAt?.toISOString() ?? null,
    });
  }
}
