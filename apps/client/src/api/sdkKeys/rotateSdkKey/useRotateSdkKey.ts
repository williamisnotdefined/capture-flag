import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SdkKey } from "../../../types";
import { sdkKeyQueryKeys } from "../queryKeys";
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
      onSuccess?.(sdkKey);
    },
  });
}
