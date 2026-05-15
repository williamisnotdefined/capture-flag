import { useQuery } from "@tanstack/react-query";
import type { AuditLogFilters } from "../../../types";
import { auditLogQueryKeys } from "../queryKeys";
import { getAuditLogs } from "./getAuditLogs";

type UseGetAuditLogsInput = {
  enabled?: boolean;
  filters: AuditLogFilters;
  organizationId: string;
};

export function useGetAuditLogs({ enabled = true, filters, organizationId }: UseGetAuditLogsInput) {
  return useQuery({
    enabled: Boolean(enabled && organizationId),
    queryFn: () => getAuditLogs({ filters, organizationId }),
    queryKey: auditLogQueryKeys.list(organizationId, filters),
  });
}
