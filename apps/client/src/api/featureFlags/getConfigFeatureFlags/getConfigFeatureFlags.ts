import { apiRequest } from "@api/client";
import type { FeatureFlag } from "@src/types";

export function getConfigFeatureFlags(configId: string) {
  return apiRequest<FeatureFlag[]>(`/configs/${configId}/feature-flags`);
}
