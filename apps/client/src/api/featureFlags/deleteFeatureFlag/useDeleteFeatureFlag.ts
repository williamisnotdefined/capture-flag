import { auditLogQueryKeys } from "@api/auditLogs/queryKeys";
import { configQueryKeys } from "@api/configs/queryKeys";
import { featureFlagQueryKeys } from "@api/featureFlags/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteFeatureFlag } from "./deleteFeatureFlag";

type UseDeleteFeatureFlagOptions = {
  configId: string;
  onSuccess?: () => void;
};

export function useDeleteFeatureFlag({ configId, onSuccess }: UseDeleteFeatureFlagOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (featureFlagId: string) => deleteFeatureFlag(configId, featureFlagId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: featureFlagQueryKeys.list(configId) });
      void queryClient.invalidateQueries({ queryKey: configQueryKeys.previewScope(configId) });
      void queryClient.invalidateQueries({ queryKey: auditLogQueryKeys.all });
      onSuccess?.();
    },
  });
}
