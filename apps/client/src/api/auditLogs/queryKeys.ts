import type { AuditLogFilters } from "@src/types";

export const auditLogQueryKeys = {
  all: ["auditLogs"] as const,
  list: (organizationId: string, filters: AuditLogFilters) =>
    [...auditLogQueryKeys.all, organizationId, filters] as const,
};
