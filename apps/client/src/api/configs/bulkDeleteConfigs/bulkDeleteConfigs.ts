import { postJson } from "@api/client";

export type BulkDeleteConfigsInput = {
  configIds: string[];
  projectId: string;
};

export function bulkDeleteConfigs({ configIds, projectId }: BulkDeleteConfigsInput) {
  return postJson<{ count: number; ok: true }>(`/projects/${projectId}/configs/bulk-delete`, {
    ids: configIds,
  });
}
