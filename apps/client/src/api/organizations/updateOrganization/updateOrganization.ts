import type { Organization } from "../../../types";
import { patchJson } from "../../client";

export type UpdateOrganizationInput = {
  organizationId: string;
  name: string;
};

export function updateOrganization({ organizationId, name }: UpdateOrganizationInput) {
  return patchJson<Organization>(`/organizations/${organizationId}`, { name });
}
