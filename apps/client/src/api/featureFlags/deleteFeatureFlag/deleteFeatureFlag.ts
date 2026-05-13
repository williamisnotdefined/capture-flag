import { deleteJson } from "../../client";

export function deleteFeatureFlag(featureFlagId: string) {
  return deleteJson<{ ok: true }>(`/feature-flags/${featureFlagId}`);
}
