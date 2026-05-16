import { deleteJson } from "@api/client";

export function deleteFeatureFlag(configId: string, featureFlagId: string) {
  return deleteJson<{ ok: true }>(`/configs/${configId}/feature-flags/${featureFlagId}`);
}
