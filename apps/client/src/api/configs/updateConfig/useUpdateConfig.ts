import { auditLogQueryKeys } from "@api/auditLogs/queryKeys";
import { configQueryKeys } from "@api/configs/queryKeys";
import type { Config } from "@src/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type UpdateConfigInput, updateConfig } from "./updateConfig";

type UseUpdateConfigOptions = {
  onSuccess?: (config: Config) => void;
  projectId: string;
};

export function useUpdateConfig({ onSuccess, projectId }: UseUpdateConfigOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateConfig,
    onSuccess: (config) => {
      void queryClient.invalidateQueries({ queryKey: configQueryKeys.list(projectId) });
      void queryClient.invalidateQueries({ queryKey: auditLogQueryKeys.all });
      onSuccess?.(config);
    },
  });
}

export type { UpdateConfigInput };
