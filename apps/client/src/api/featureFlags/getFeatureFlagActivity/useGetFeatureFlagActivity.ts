import { useQuery } from "@tanstack/react-query";
import { featureFlagQueryKeys } from "../queryKeys";
import { getFeatureFlagActivity } from "./getFeatureFlagActivity";

type UseGetFeatureFlagActivityInput = {
  configId: string;
  featureFlagId: string;
};

export function useGetFeatureFlagActivity({
  configId,
  featureFlagId,
}: UseGetFeatureFlagActivityInput) {
  return useQuery({
    enabled: Boolean(configId && featureFlagId),
    queryFn: () => getFeatureFlagActivity({ configId, featureFlagId }),
    queryKey: featureFlagQueryKeys.activity(configId, featureFlagId),
  });
}
