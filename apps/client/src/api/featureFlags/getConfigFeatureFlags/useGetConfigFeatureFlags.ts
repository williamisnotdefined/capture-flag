import { useQuery } from "@tanstack/react-query";
import { featureFlagQueryKeys } from "../queryKeys";
import { getConfigFeatureFlags } from "./getConfigFeatureFlags";

export function useGetConfigFeatureFlags(configId: string) {
  return useQuery({
    enabled: Boolean(configId),
    queryFn: () => getConfigFeatureFlags(configId),
    queryKey: featureFlagQueryKeys.list(configId),
  });
}
