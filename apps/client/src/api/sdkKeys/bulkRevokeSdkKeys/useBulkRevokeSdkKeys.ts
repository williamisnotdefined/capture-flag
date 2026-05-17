import { auditLogQueryKeys } from "@api/auditLogs/queryKeys";
import { sdkKeyQueryKeys } from "@api/sdkKeys/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkRevokeSdkKeys } from "./bulkRevokeSdkKeys";

type UseBulkRevokeSdkKeysOptions = {
  onSuccess?: (sdkKeyIds: string[]) => void;
  projectId: string;
};

export function useBulkRevokeSdkKeys({ onSuccess, projectId }: UseBulkRevokeSdkKeysOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sdkKeyIds: string[]) => bulkRevokeSdkKeys({ projectId, sdkKeyIds }),
    onSuccess: (_result, sdkKeyIds) => {
      void queryClient.invalidateQueries({ queryKey: sdkKeyQueryKeys.list(projectId) });
      void queryClient.invalidateQueries({ queryKey: auditLogQueryKeys.all });
      onSuccess?.(sdkKeyIds);
    },
  });
}
