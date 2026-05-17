import { auditLogQueryKeys } from "@api/auditLogs/queryKeys";
import { configQueryKeys } from "@api/configs/queryKeys";
import { featureFlagQueryKeys } from "@api/featureFlags/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkDeleteFeatureFlags } from "./bulkDeleteFeatureFlags";

type UseBulkDeleteFeatureFlagsOptions = {
  configId: string;
  onSuccess?: (featureFlagIds: string[]) => void;
};

export function useBulkDeleteFeatureFlags({
  configId,
  onSuccess,
}: UseBulkDeleteFeatureFlagsOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (featureFlagIds: string[]) => bulkDeleteFeatureFlags({ configId, featureFlagIds }),
    onSuccess: (_result, featureFlagIds) => {
      void queryClient.invalidateQueries({ queryKey: featureFlagQueryKeys.list(configId) });
      void queryClient.invalidateQueries({ queryKey: configQueryKeys.previewScope(configId) });
      void queryClient.invalidateQueries({ queryKey: auditLogQueryKeys.all });
      onSuccess?.(featureFlagIds);
    },
  });
}
