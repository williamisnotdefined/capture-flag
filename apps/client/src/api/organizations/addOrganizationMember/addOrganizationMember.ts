import { postJson } from "@api/client";
import type { OrganizationMember } from "@src/types";

export type AddOrganizationMemberInput = {
  organizationId: string;
  userId?: string;
  email?: string;
  role: string;
};

export function addOrganizationMember({ organizationId, ...body }: AddOrganizationMemberInput) {
  return postJson<OrganizationMember>(`/organizations/${organizationId}/members`, body);
}
