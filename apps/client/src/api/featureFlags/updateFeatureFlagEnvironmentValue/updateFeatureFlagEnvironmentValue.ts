import type { FeatureFlagEnvironmentValue } from "../../../types";
import { patchJson } from "../../client";

export type UpdateFeatureFlagEnvironmentValueValues = {
  defaultValue?: unknown;
  percentageAttribute?: string;
  percentageOptionsJson?: unknown;
  rulesJson?: unknown;
};

type UpdateFeatureFlagEnvironmentValueInput = UpdateFeatureFlagEnvironmentValueValues & {
  environmentId: string;
  featureFlagId: string;
};

export function updateFeatureFlagEnvironmentValue({
  environmentId,
  featureFlagId,
  ...values
}: UpdateFeatureFlagEnvironmentValueInput) {
  return patchJson<FeatureFlagEnvironmentValue>(
    `/feature-flags/${featureFlagId}/environments/${environmentId}/value`,
    values,
  );
}
