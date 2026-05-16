import { apiRequest } from "@api/client";
import type { OrganizationMember } from "@src/types";

export function getOrganizationMembers(organizationId: string) {
  return apiRequest<OrganizationMember[]>(`/organizations/${organizationId}/members`);
}
