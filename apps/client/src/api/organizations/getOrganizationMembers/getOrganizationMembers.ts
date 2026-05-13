import type { OrganizationMember } from "../../../types";
import { apiRequest } from "../../client";

export function getOrganizationMembers(organizationId: string) {
  return apiRequest<OrganizationMember[]>(`/organizations/${organizationId}/members`);
}
