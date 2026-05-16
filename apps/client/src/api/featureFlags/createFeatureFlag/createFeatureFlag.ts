import { postJson } from "@api/client";
import type { FeatureFlag, FeatureFlagType } from "@src/types";

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
