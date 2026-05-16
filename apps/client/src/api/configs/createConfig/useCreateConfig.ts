import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Config } from "../../../types";
import { auditLogQueryKeys } from "../../auditLogs/queryKeys";
import { configQueryKeys } from "../queryKeys";
import { createConfig } from "./createConfig";

type UseCreateConfigOptions = {
  onSuccess?: (config: Config) => void;
  projectId: string;
};

export function useCreateConfig({ onSuccess, projectId }: UseCreateConfigOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createConfig({ name, projectId }),
    onSuccess: (config) => {
      void queryClient.invalidateQueries({ queryKey: configQueryKeys.list(projectId) });
      void queryClient.invalidateQueries({ queryKey: auditLogQueryKeys.all });
      onSuccess?.(config);
    },
  });
}
