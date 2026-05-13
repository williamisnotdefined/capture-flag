import type { FeatureFlag } from "../../../types";
import { patchJson } from "../../client";

export type UpdateFeatureFlagValues = {
  description?: string;
  hint?: string;
  key?: string;
  name?: string;
  ownerUserId?: string | null;
  tags?: string[];
};

type UpdateFeatureFlagInput = UpdateFeatureFlagValues & {
  featureFlagId: string;
};

export function updateFeatureFlag({ featureFlagId, ...values }: UpdateFeatureFlagInput) {
  return patchJson<FeatureFlag>(`/feature-flags/${featureFlagId}`, values);
}
