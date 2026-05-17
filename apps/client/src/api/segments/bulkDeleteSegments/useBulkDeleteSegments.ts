import { auditLogQueryKeys } from "@api/auditLogs/queryKeys";
import { configQueryKeys } from "@api/configs/queryKeys";
import { segmentQueryKeys } from "@api/segments/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkDeleteSegments } from "./bulkDeleteSegments";

type UseBulkDeleteSegmentsOptions = {
  configId: string;
  onSuccess?: (segmentIds: string[]) => void;
};

export function useBulkDeleteSegments({ configId, onSuccess }: UseBulkDeleteSegmentsOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (segmentIds: string[]) => bulkDeleteSegments({ configId, segmentIds }),
    onSuccess: (_result, segmentIds) => {
      void queryClient.invalidateQueries({ queryKey: segmentQueryKeys.list(configId) });
      void queryClient.invalidateQueries({ queryKey: configQueryKeys.previewScope(configId) });
      void queryClient.invalidateQueries({ queryKey: auditLogQueryKeys.all });
      onSuccess?.(segmentIds);
    },
  });
}
