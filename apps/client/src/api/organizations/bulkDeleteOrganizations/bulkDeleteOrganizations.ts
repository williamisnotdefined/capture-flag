import { postJson } from "@api/client";

export function bulkDeleteOrganizations(organizationIds: string[]) {
  return postJson<{ count: number; ok: true }>("/organizations/bulk-delete", {
    ids: organizationIds,
  });
}
