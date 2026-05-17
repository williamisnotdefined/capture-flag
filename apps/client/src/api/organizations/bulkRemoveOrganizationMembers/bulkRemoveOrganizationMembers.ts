import { postJson } from "@api/client";

export type BulkRemoveOrganizationMembersInput = {
  memberIds: string[];
  organizationId: string;
};

export function bulkRemoveOrganizationMembers({
  memberIds,
  organizationId,
}: BulkRemoveOrganizationMembersInput) {
  return postJson<{ count: number; ok: true }>(
    `/organizations/${organizationId}/members/bulk-remove`,
    { ids: memberIds },
  );
}
