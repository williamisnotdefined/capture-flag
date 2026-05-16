import { auditLogQueryKeys } from "@api/auditLogs/queryKeys";
import type { AuditLogFilters, AuditLogListResponse } from "@src/types";
import { type InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { getAuditLogs } from "./getAuditLogs";

type UseGetAuditLogsInput = {
  enabled?: boolean;
  filters: AuditLogFilters;
  organizationId: string;
};

type AuditLogQueryKey = ReturnType<typeof auditLogQueryKeys.list>;

export function useGetAuditLogs({ enabled = true, filters, organizationId }: UseGetAuditLogsInput) {
  return useInfiniteQuery<
    AuditLogListResponse,
    Error,
    InfiniteData<AuditLogListResponse, string | null>,
    AuditLogQueryKey,
    string | null
  >({
    enabled: Boolean(enabled && organizationId),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      getAuditLogs({
        filters: {
          ...filters,
          ...(pageParam ? { cursor: pageParam } : {}),
        },
        organizationId,
      }),
    queryKey: auditLogQueryKeys.list(organizationId, filters),
  });
}
