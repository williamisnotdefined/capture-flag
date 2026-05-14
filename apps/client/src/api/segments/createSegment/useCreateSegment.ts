import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Segment } from "../../../types";
import { segmentQueryKeys } from "../queryKeys";
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
      onSuccess?.(segment);
    },
  });
}
