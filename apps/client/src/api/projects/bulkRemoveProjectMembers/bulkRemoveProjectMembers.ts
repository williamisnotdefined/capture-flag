import { postJson } from "@api/client";

export type BulkRemoveProjectMembersInput = {
  memberIds: string[];
  projectId: string;
};

export function bulkRemoveProjectMembers({ memberIds, projectId }: BulkRemoveProjectMembersInput) {
  return postJson<{ count: number; ok: true }>(`/projects/${projectId}/members/bulk-remove`, {
    ids: memberIds,
  });
}
