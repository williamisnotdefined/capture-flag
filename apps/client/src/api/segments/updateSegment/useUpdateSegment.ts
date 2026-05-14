import { useMutation, useQueryClient } from "@tanstack/react-query";
import { configQueryKeys } from "../../configs/queryKeys";
import { segmentQueryKeys } from "../queryKeys";
import { type UpdateSegmentValues, updateSegment } from "./updateSegment";

type UpdateSegmentMutationValues = UpdateSegmentValues & {
  segmentId: string;
};

type UseUpdateSegmentOptions = {
  configId: string;
};

export function useUpdateSegment({ configId }: UseUpdateSegmentOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: UpdateSegmentMutationValues) => updateSegment({ ...values, configId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: segmentQueryKeys.list(configId) });
      void queryClient.invalidateQueries({ queryKey: configQueryKeys.previewScope(configId) });
    },
  });
}
