import type { OrganizationMember } from "../../../types";
import { postJson } from "../../client";

export type AddOrganizationMemberInput = {
  organizationId: string;
  userId?: string;
  email?: string;
  role: string;
};

export function addOrganizationMember({ organizationId, ...body }: AddOrganizationMemberInput) {
  return postJson<OrganizationMember>(`/organizations/${organizationId}/members`, body);
}
