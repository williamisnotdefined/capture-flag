import { postJson } from "@api/client";

export type BulkDeleteEnvironmentsInput = {
  environmentIds: string[];
  projectId: string;
};

export function bulkDeleteEnvironments({ environmentIds, projectId }: BulkDeleteEnvironmentsInput) {
  return postJson<{ count: number; ok: true }>(`/projects/${projectId}/environments/bulk-delete`, {
    ids: environmentIds,
  });
}
