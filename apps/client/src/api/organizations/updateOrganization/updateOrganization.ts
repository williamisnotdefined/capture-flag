import { patchJson } from "@api/client";
import type { Organization } from "@src/types";

export type UpdateOrganizationInput = {
  organizationId: string;
  name: string;
};

export function updateOrganization({ organizationId, name }: UpdateOrganizationInput) {
  return patchJson<Organization>(`/organizations/${organizationId}`, { name });
}
