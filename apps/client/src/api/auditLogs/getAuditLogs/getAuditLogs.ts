import { apiRequest } from "@api/client";
import type { AuditLogFilters, AuditLogListResponse } from "@src/types";

type GetAuditLogsInput = {
  filters: AuditLogFilters;
  organizationId: string;
};

export function getAuditLogs({ filters, organizationId }: GetAuditLogsInput) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const queryString = searchParams.toString();

  return apiRequest<AuditLogListResponse>(
    `/organizations/${organizationId}/audit-logs${queryString ? `?${queryString}` : ""}`,
  );
}
