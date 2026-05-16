import { deleteJson } from "@api/client";

export function deleteOrganization(organizationId: string) {
  return deleteJson<{ ok: true }>(`/organizations/${organizationId}`);
}
