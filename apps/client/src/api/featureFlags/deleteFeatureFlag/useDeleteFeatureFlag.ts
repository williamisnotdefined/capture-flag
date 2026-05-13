import { useMutation, useQueryClient } from "@tanstack/react-query";
import { featureFlagQueryKeys } from "../queryKeys";
import { deleteFeatureFlag } from "./deleteFeatureFlag";

type UseDeleteFeatureFlagOptions = {
  configId: string;
  onSuccess?: () => void;
};

export function useDeleteFeatureFlag({ configId, onSuccess }: UseDeleteFeatureFlagOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (featureFlagId: string) => deleteFeatureFlag(featureFlagId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: featureFlagQueryKeys.list(configId) });
      onSuccess?.();
    },
  });
}
