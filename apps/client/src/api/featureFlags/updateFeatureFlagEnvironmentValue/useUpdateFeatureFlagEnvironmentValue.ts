import { auditLogQueryKeys } from "@api/auditLogs/queryKeys";
import { configQueryKeys } from "@api/configs/queryKeys";
import { featureFlagQueryKeys } from "@api/featureFlags/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type UpdateFeatureFlagEnvironmentValueValues,
  updateFeatureFlagEnvironmentValue,
} from "./updateFeatureFlagEnvironmentValue";

type UpdateFeatureFlagEnvironmentValueMutationValues = UpdateFeatureFlagEnvironmentValueValues & {
  environmentId: string;
  featureFlagId: string;
};

type UseUpdateFeatureFlagEnvironmentValueOptions = {
  configId: string;
};

export function useUpdateFeatureFlagEnvironmentValue({
  configId,
}: UseUpdateFeatureFlagEnvironmentValueOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: UpdateFeatureFlagEnvironmentValueMutationValues) =>
      updateFeatureFlagEnvironmentValue({ configId, ...values }),
    onSuccess: (_value, variables) => {
      void queryClient.invalidateQueries({ queryKey: featureFlagQueryKeys.list(configId) });
      void queryClient.invalidateQueries({
        queryKey: featureFlagQueryKeys.activity(configId, variables.featureFlagId),
      });
      void queryClient.invalidateQueries({
        queryKey: configQueryKeys.preview(configId, variables.environmentId),
      });
      void queryClient.invalidateQueries({ queryKey: auditLogQueryKeys.all });
    },
  });
}
