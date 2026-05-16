import { auditLogQueryKeys } from "@api/auditLogs/queryKeys";
import { sdkKeyQueryKeys } from "@api/sdkKeys/queryKeys";
import type { SdkKey } from "@src/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rotateSdkKey } from "./rotateSdkKey";

type UseRotateSdkKeyOptions = {
  onSuccess?: (sdkKey: SdkKey) => void;
  projectId: string;
};

export function useRotateSdkKey({ onSuccess, projectId }: UseRotateSdkKeyOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rotateSdkKey,
    onSuccess: (sdkKey) => {
      void queryClient.invalidateQueries({ queryKey: sdkKeyQueryKeys.list(projectId) });
      void queryClient.invalidateQueries({ queryKey: auditLogQueryKeys.all });
      onSuccess?.(sdkKey);
    },
  });
}
