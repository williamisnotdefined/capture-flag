import { postJson } from "@api/client";

export type BulkDeleteSegmentsInput = {
  configId: string;
  segmentIds: string[];
};

export function bulkDeleteSegments({ configId, segmentIds }: BulkDeleteSegmentsInput) {
  return postJson<{ count: number; ok: true }>(`/configs/${configId}/segments/bulk-delete`, {
    ids: segmentIds,
  });
}
