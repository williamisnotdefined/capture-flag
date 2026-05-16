import { postJson } from "@api/client";
import type { ProjectMember } from "@src/types";

export type AddProjectMemberInput = {
  projectId: string;
  userId?: string;
  email?: string;
  role: string;
};

export function addProjectMember({ projectId, ...body }: AddProjectMemberInput) {
  return postJson<ProjectMember>(`/projects/${projectId}/members`, body);
}
