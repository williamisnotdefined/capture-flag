import { useMutation, useQueryClient } from "@tanstack/react-query";
import { configQueryKeys } from "../queryKeys";
import { createConfig } from "./createConfig";

type UseCreateConfigOptions = {
  projectId: string;
};

export function useCreateConfig({ projectId }: UseCreateConfigOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createConfig({ name, projectId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: configQueryKeys.list(projectId) });
    },
  });
}
