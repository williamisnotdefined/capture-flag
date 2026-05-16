import { featureFlagQueryKeys } from "@api/featureFlags/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { getConfigFeatureFlags } from "./getConfigFeatureFlags";

export function useGetConfigFeatureFlags(configId: string) {
  return useQuery({
    enabled: Boolean(configId),
    queryFn: () => getConfigFeatureFlags(configId),
    queryKey: featureFlagQueryKeys.list(configId),
  });
}
