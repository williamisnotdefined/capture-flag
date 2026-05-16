import { deleteJson } from "@api/client";

export type RemoveProjectMemberInput = {
  memberId: string;
  projectId: string;
};

export function removeProjectMember({ memberId, projectId }: RemoveProjectMemberInput) {
  return deleteJson<{ ok: true }>(`/projects/${projectId}/members/${memberId}`);
}
