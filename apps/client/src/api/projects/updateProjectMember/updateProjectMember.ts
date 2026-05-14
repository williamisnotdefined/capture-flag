import type { ProjectMember } from "../../../types";
import { patchJson } from "../../client";

export type UpdateProjectMemberInput = {
  memberId: string;
  projectId: string;
  role: string;
};

export function updateProjectMember({ memberId, projectId, role }: UpdateProjectMemberInput) {
  return patchJson<ProjectMember>(`/projects/${projectId}/members/${memberId}`, { role });
}
