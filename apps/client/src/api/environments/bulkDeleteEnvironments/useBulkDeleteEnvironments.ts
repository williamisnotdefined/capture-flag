import { configQueryKeys } from "@api/configs/queryKeys";
import { environmentQueryKeys } from "@api/environments/queryKeys";
import { featureFlagQueryKeys } from "@api/featureFlags/queryKeys";
import { sdkKeyQueryKeys } from "@api/sdkKeys/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkDeleteEnvironments } from "./bulkDeleteEnvironments";

type UseBulkDeleteEnvironmentsOptions = {
  onSuccess?: (environmentIds: string[]) => void;
  projectId: string;
};

export function useBulkDeleteEnvironments({
  onSuccess,
  projectId,
}: UseBulkDeleteEnvironmentsOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (environmentIds: string[]) => bulkDeleteEnvironments({ environmentIds, projectId }),
    onSuccess: (_result, environmentIds) => {
      void queryClient.invalidateQueries({ queryKey: environmentQueryKeys.list(projectId) });
      void queryClient.invalidateQueries({ queryKey: configQueryKeys.previews() });
      void queryClient.invalidateQueries({ queryKey: featureFlagQueryKeys.all() });
      void queryClient.invalidateQueries({ queryKey: sdkKeyQueryKeys.list(projectId) });
      onSuccess?.(environmentIds);
    },
  });
}
