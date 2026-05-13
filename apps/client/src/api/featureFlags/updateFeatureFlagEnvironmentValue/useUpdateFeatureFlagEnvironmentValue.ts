import { useMutation, useQueryClient } from "@tanstack/react-query";
import { featureFlagQueryKeys } from "../queryKeys";
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
      updateFeatureFlagEnvironmentValue(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: featureFlagQueryKeys.list(configId) });
    },
  });
}
