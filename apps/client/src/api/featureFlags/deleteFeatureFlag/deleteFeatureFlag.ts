import { deleteJson } from "../../client";

export function deleteFeatureFlag(configId: string, featureFlagId: string) {
  return deleteJson<{ ok: true }>(`/configs/${configId}/feature-flags/${featureFlagId}`);
}
