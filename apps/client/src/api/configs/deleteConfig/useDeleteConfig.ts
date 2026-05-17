import { auditLogQueryKeys } from "@api/auditLogs/queryKeys";
import { configQueryKeys } from "@api/configs/queryKeys";
import { featureFlagQueryKeys } from "@api/featureFlags/queryKeys";
import { sdkKeyQueryKeys } from "@api/sdkKeys/queryKeys";
import { segmentQueryKeys } from "@api/segments/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteConfig } from "./deleteConfig";

type UseDeleteConfigOptions = {
  onSuccess?: (configId: string) => void;
  projectId: string;
};

export function useDeleteConfig({ onSuccess, projectId }: UseDeleteConfigOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteConfig,
    onSuccess: (_result, configId) => {
      void queryClient.invalidateQueries({ queryKey: configQueryKeys.list(projectId) });
      void queryClient.invalidateQueries({ queryKey: configQueryKeys.previewScope(configId) });
      void queryClient.invalidateQueries({ queryKey: featureFlagQueryKeys.list(configId) });
      void queryClient.invalidateQueries({ queryKey: segmentQueryKeys.list(configId) });
      void queryClient.invalidateQueries({ queryKey: sdkKeyQueryKeys.list(projectId) });
      void queryClient.invalidateQueries({ queryKey: auditLogQueryKeys.all });
      onSuccess?.(configId);
    },
  });
}
