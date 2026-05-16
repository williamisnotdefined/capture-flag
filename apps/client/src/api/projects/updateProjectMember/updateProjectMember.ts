import { patchJson } from "@api/client";
import type { ProjectMember } from "@src/types";

export type UpdateProjectMemberInput = {
  memberId: string;
  projectId: string;
  role: string;
};

export function updateProjectMember({ memberId, projectId, role }: UpdateProjectMemberInput) {
  return patchJson<ProjectMember>(`/projects/${projectId}/members/${memberId}`, { role });
}
