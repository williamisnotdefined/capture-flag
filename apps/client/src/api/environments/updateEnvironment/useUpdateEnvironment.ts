import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Environment } from "../../../types";
import { environmentQueryKeys } from "../queryKeys";
import { type UpdateEnvironmentInput, updateEnvironment } from "./updateEnvironment";

type UseUpdateEnvironmentOptions = {
  onSuccess?: (environment: Environment) => void;
  projectId: string;
};

export function useUpdateEnvironment({ onSuccess, projectId }: UseUpdateEnvironmentOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEnvironment,
    onSuccess: (environment) => {
      void queryClient.invalidateQueries({ queryKey: environmentQueryKeys.list(projectId) });
      onSuccess?.(environment);
    },
  });
}

export type { UpdateEnvironmentInput };
