import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SdkKey } from "../../../types";
import { sdkKeyQueryKeys } from "../queryKeys";
import { createSdkKey } from "./createSdkKey";

type CreateSdkKeyValues = {
  configId: string;
  environmentId: string;
  name?: string;
};

type UseCreateSdkKeyOptions = {
  projectId: string;
  onSuccess?: (sdkKey: SdkKey) => void;
};

export function useCreateSdkKey({ projectId, onSuccess }: UseCreateSdkKeyOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CreateSdkKeyValues) => createSdkKey({ ...values, projectId }),
    onSuccess: (sdkKey) => {
      void queryClient.invalidateQueries({ queryKey: sdkKeyQueryKeys.list(projectId) });
      onSuccess?.(sdkKey);
    },
  });
}
