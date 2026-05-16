import { deleteJson } from "@api/client";

export type RemoveOrganizationMemberInput = {
  memberId: string;
  organizationId: string;
};

export function removeOrganizationMember({
  memberId,
  organizationId,
}: RemoveOrganizationMemberInput) {
  return deleteJson<{ ok: true }>(`/organizations/${organizationId}/members/${memberId}`);
}
