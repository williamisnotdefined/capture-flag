import { auditLogQueryKeys } from "@api/auditLogs/queryKeys";
import { configQueryKeys } from "@api/configs/queryKeys";
import { segmentQueryKeys } from "@api/segments/queryKeys";
import type { Segment } from "@src/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type CreateSegmentValues, createSegment } from "./createSegment";

type UseCreateSegmentOptions = {
  configId: string;
  onSuccess?: (segment: Segment) => void;
};

export function useCreateSegment({ configId, onSuccess }: UseCreateSegmentOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CreateSegmentValues) => createSegment({ ...values, configId }),
    onSuccess: (segment) => {
      void queryClient.invalidateQueries({ queryKey: segmentQueryKeys.list(configId) });
      void queryClient.invalidateQueries({ queryKey: configQueryKeys.previewScope(configId) });
      void queryClient.invalidateQueries({ queryKey: auditLogQueryKeys.all });
      onSuccess?.(segment);
    },
  });
}
