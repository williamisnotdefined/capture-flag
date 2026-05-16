import { patchJson } from "@api/client";
import type { FeatureFlagEnvironmentValue } from "@src/types";

export type UpdateFeatureFlagEnvironmentValueValues = {
  defaultValue?: unknown;
  percentageAttribute?: string;
  percentageOptionsJson?: unknown;
  rulesJson?: unknown;
};

type UpdateFeatureFlagEnvironmentValueInput = UpdateFeatureFlagEnvironmentValueValues & {
  configId: string;
  environmentId: string;
  featureFlagId: string;
};

export function updateFeatureFlagEnvironmentValue({
  configId,
  environmentId,
  featureFlagId,
  ...values
}: UpdateFeatureFlagEnvironmentValueInput) {
  return patchJson<FeatureFlagEnvironmentValue>(
    `/configs/${configId}/feature-flags/${featureFlagId}/environments/${environmentId}/value`,
    values,
  );
}
