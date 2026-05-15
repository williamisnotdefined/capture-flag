import { type InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import type { AuditLogListResponse } from "../../../types";
import { featureFlagQueryKeys } from "../queryKeys";
import { getFeatureFlagActivity } from "./getFeatureFlagActivity";

type UseGetFeatureFlagActivityInput = {
  configId: string;
  featureFlagId: string;
};

type FeatureFlagActivityQueryKey = ReturnType<typeof featureFlagQueryKeys.activity>;

export function useGetFeatureFlagActivity({
  configId,
  featureFlagId,
}: UseGetFeatureFlagActivityInput) {
  return useInfiniteQuery<
    AuditLogListResponse,
    Error,
    InfiniteData<AuditLogListResponse, string | null>,
    FeatureFlagActivityQueryKey,
    string | null
  >({
    enabled: Boolean(configId && featureFlagId),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      getFeatureFlagActivity({ configId, cursor: pageParam, featureFlagId, limit: 50 }),
    queryKey: featureFlagQueryKeys.activity(configId, featureFlagId),
  });
}
