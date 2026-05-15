import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FeatureFlag } from "../../../types";
import { auditLogQueryKeys } from "../../auditLogs/queryKeys";
import { configQueryKeys } from "../../configs/queryKeys";
import { featureFlagQueryKeys } from "../queryKeys";
import { type UpdateFeatureFlagValues, updateFeatureFlag } from "./updateFeatureFlag";

type UpdateFeatureFlagMutationValues = UpdateFeatureFlagValues & {
  featureFlagId: string;
};

type UseUpdateFeatureFlagOptions = {
  configId: string;
  onSuccess?: (featureFlag: FeatureFlag) => void;
};

export function useUpdateFeatureFlag({ configId, onSuccess }: UseUpdateFeatureFlagOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: UpdateFeatureFlagMutationValues) =>
      updateFeatureFlag({ configId, ...values }),
    onSuccess: (featureFlag) => {
      void queryClient.invalidateQueries({ queryKey: featureFlagQueryKeys.list(configId) });
      void queryClient.invalidateQueries({
        queryKey: featureFlagQueryKeys.activityScope(configId),
      });
      void queryClient.invalidateQueries({ queryKey: configQueryKeys.previewScope(configId) });
      void queryClient.invalidateQueries({ queryKey: auditLogQueryKeys.all });
      onSuccess?.(featureFlag);
    },
  });
}
