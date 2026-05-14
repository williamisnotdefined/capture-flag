import { useMutation, useQueryClient } from "@tanstack/react-query";
import { segmentQueryKeys } from "../queryKeys";
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
      onSuccess?.();
    },
  });
}
