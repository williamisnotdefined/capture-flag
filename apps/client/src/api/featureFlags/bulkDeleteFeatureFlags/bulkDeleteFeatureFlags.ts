import { postJson } from "@api/client";

export type BulkDeleteFeatureFlagsInput = {
  configId: string;
  featureFlagIds: string[];
};

export function bulkDeleteFeatureFlags({ configId, featureFlagIds }: BulkDeleteFeatureFlagsInput) {
  return postJson<{ count: number; ok: true }>(`/configs/${configId}/feature-flags/bulk-delete`, {
    ids: featureFlagIds,
  });
}
