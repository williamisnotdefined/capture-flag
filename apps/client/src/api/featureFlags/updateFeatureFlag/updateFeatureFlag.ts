import { patchJson } from "@api/client";
import type { FeatureFlag } from "@src/types";

export type UpdateFeatureFlagValues = {
  description?: string;
  hint?: string;
  key?: string;
  name?: string;
  ownerUserId?: string | null;
  tags?: string[];
};

type UpdateFeatureFlagInput = UpdateFeatureFlagValues & {
  configId: string;
  featureFlagId: string;
};

export function updateFeatureFlag({ configId, featureFlagId, ...values }: UpdateFeatureFlagInput) {
  return patchJson<FeatureFlag>(`/configs/${configId}/feature-flags/${featureFlagId}`, values);
}
