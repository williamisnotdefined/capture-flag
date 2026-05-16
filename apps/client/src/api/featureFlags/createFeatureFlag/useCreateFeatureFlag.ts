import { auditLogQueryKeys } from "@api/auditLogs/queryKeys";
import { configQueryKeys } from "@api/configs/queryKeys";
import { featureFlagQueryKeys } from "@api/featureFlags/queryKeys";
import type { FeatureFlag } from "@src/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
      void queryClient.invalidateQueries({ queryKey: configQueryKeys.previewScope(configId) });
      void queryClient.invalidateQueries({ queryKey: auditLogQueryKeys.all });
      onSuccess?.(featureFlag);
    },
  });
}
