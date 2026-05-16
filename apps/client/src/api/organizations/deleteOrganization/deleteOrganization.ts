import { deleteJson } from "../../client";

export function deleteOrganization(organizationId: string) {
  return deleteJson<{ ok: true }>(`/organizations/${organizationId}`);
}
