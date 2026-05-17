import { postJson } from "@api/client";

export type BulkDeleteProjectsInput = {
  organizationId: string;
  projectIds: string[];
};

export function bulkDeleteProjects({ organizationId, projectIds }: BulkDeleteProjectsInput) {
  return postJson<{ count: number; ok: true }>(
    `/organizations/${organizationId}/projects/bulk-delete`,
    { ids: projectIds },
  );
}
