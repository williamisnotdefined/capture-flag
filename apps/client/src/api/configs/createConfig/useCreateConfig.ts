import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Config } from "../../../types";
import { auditLogQueryKeys } from "../../auditLogs/queryKeys";
import { configQueryKeys } from "../queryKeys";
import { type CreateConfigInput, createConfig } from "./createConfig";

type UseCreateConfigOptions = {
  onSuccess?: (config: Config) => void;
  projectId: string;
};

export function useCreateConfig({ onSuccess, projectId }: UseCreateConfigOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<CreateConfigInput, "projectId">) =>
      createConfig({ ...input, projectId }),
    onSuccess: (config) => {
      void queryClient.invalidateQueries({ queryKey: configQueryKeys.list(projectId) });
      void queryClient.invalidateQueries({ queryKey: auditLogQueryKeys.all });
      onSuccess?.(config);
    },
  });
}
