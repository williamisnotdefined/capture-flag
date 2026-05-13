import { useMutation, useQueryClient } from "@tanstack/react-query";
import { environmentQueryKeys } from "../queryKeys";
import { createEnvironment } from "./createEnvironment";

type UseCreateEnvironmentOptions = {
  projectId: string;
};

export function useCreateEnvironment({ projectId }: UseCreateEnvironmentOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createEnvironment({ name, projectId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: environmentQueryKeys.list(projectId) });
    },
  });
}
