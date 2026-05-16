import { auditLogQueryKeys } from "@api/auditLogs/queryKeys";
import { configQueryKeys } from "@api/configs/queryKeys";
import { segmentQueryKeys } from "@api/segments/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSegment } from "./deleteSegment";

type UseDeleteSegmentOptions = {
  configId: string;
  onSuccess?: () => void;
};

export function useDeleteSegment({ configId, onSuccess }: UseDeleteSegmentOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (segmentId: string) => deleteSegment({ configId, segmentId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: segmentQueryKeys.list(configId) });
      void queryClient.invalidateQueries({ queryKey: configQueryKeys.previewScope(configId) });
      void queryClient.invalidateQueries({ queryKey: auditLogQueryKeys.all });
      onSuccess?.();
    },
  });
}
