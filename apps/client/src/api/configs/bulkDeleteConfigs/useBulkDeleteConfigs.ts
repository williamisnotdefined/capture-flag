import { auditLogQueryKeys } from "@api/auditLogs/queryKeys";
import { configQueryKeys } from "@api/configs/queryKeys";
import { featureFlagQueryKeys } from "@api/featureFlags/queryKeys";
import { sdkKeyQueryKeys } from "@api/sdkKeys/queryKeys";
import { segmentQueryKeys } from "@api/segments/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkDeleteConfigs } from "./bulkDeleteConfigs";

type UseBulkDeleteConfigsOptions = {
  onSuccess?: (configIds: string[]) => void;
  projectId: string;
};

export function useBulkDeleteConfigs({ onSuccess, projectId }: UseBulkDeleteConfigsOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (configIds: string[]) => bulkDeleteConfigs({ configIds, projectId }),
    onSuccess: (_result, configIds) => {
      void queryClient.invalidateQueries({ queryKey: configQueryKeys.list(projectId) });
      for (const configId of configIds) {
        void queryClient.invalidateQueries({ queryKey: configQueryKeys.previewScope(configId) });
        void queryClient.invalidateQueries({ queryKey: featureFlagQueryKeys.list(configId) });
        void queryClient.invalidateQueries({ queryKey: segmentQueryKeys.list(configId) });
      }
      void queryClient.invalidateQueries({ queryKey: sdkKeyQueryKeys.list(projectId) });
      void queryClient.invalidateQueries({ queryKey: auditLogQueryKeys.all });
      onSuccess?.(configIds);
    },
  });
}
