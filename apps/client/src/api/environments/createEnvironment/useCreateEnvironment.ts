import { environmentQueryKeys } from "@api/environments/queryKeys";
import type { Environment } from "@src/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEnvironment } from "./createEnvironment";

type UseCreateEnvironmentOptions = {
  onSuccess?: (environment: Environment) => void;
  projectId: string;
};

export function useCreateEnvironment({ onSuccess, projectId }: UseCreateEnvironmentOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createEnvironment({ name, projectId }),
    onSuccess: (environment) => {
      void queryClient.invalidateQueries({ queryKey: environmentQueryKeys.list(projectId) });
      onSuccess?.(environment);
    },
  });
}
