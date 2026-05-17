import { configQueryKeys } from "@api/configs/queryKeys";
import { environmentQueryKeys } from "@api/environments/queryKeys";
import { featureFlagQueryKeys } from "@api/featureFlags/queryKeys";
import { sdkKeyQueryKeys } from "@api/sdkKeys/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteEnvironment } from "./deleteEnvironment";

type UseDeleteEnvironmentOptions = {
  onSuccess?: (environmentId: string) => void;
  projectId: string;
};

export function useDeleteEnvironment({ onSuccess, projectId }: UseDeleteEnvironmentOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEnvironment,
    onSuccess: (_result, environmentId) => {
      void queryClient.invalidateQueries({ queryKey: environmentQueryKeys.list(projectId) });
      void queryClient.invalidateQueries({ queryKey: configQueryKeys.previews() });
      void queryClient.invalidateQueries({ queryKey: featureFlagQueryKeys.all() });
      void queryClient.invalidateQueries({ queryKey: sdkKeyQueryKeys.list(projectId) });
      onSuccess?.(environmentId);
    },
  });
}
