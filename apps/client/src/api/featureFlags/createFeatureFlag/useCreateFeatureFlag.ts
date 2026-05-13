import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FeatureFlag } from "../../../types";
import { featureFlagQueryKeys } from "../queryKeys";
import { type CreateFeatureFlagValues, createFeatureFlag } from "./createFeatureFlag";

type UseCreateFeatureFlagOptions = {
  configId: string;
  onSuccess?: (featureFlag: FeatureFlag) => void;
};

export function useCreateFeatureFlag({ configId, onSuccess }: UseCreateFeatureFlagOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CreateFeatureFlagValues) => createFeatureFlag({ ...values, configId }),
    onSuccess: (featureFlag) => {
      void queryClient.invalidateQueries({ queryKey: featureFlagQueryKeys.list(configId) });
      onSuccess?.(featureFlag);
    },
  });
}
