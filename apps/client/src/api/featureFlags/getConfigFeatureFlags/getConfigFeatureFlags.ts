import type { FeatureFlag } from "../../../types";
import { apiRequest } from "../../client";

export function getConfigFeatureFlags(configId: string) {
  return apiRequest<FeatureFlag[]>(`/configs/${configId}/feature-flags`);
}
