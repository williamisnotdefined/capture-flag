import type { OrganizationMember, OrganizationRole } from "../../../types";
import { patchJson } from "../../client";

export type UpdateOrganizationMemberInput = {
  memberId: string;
  organizationId: string;
  role: OrganizationRole;
};

export function updateOrganizationMember({
  memberId,
  organizationId,
  role,
}: UpdateOrganizationMemberInput) {
  return patchJson<OrganizationMember>(`/organizations/${organizationId}/members/${memberId}`, {
    role,
  });
}
