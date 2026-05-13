import type { FeatureFlag, FeatureFlagType } from "../../../types";
import { postJson } from "../../client";

export type CreateFeatureFlagValues = {
  key: string;
  name: string;
  type: FeatureFlagType;
  description?: string;
  hint?: string;
  ownerUserId?: string;
  tags?: string[];
};

type CreateFeatureFlagInput = CreateFeatureFlagValues & {
  configId: string;
};

export function createFeatureFlag({ configId, ...values }: CreateFeatureFlagInput) {
  return postJson<FeatureFlag>(`/configs/${configId}/feature-flags`, values);
}
