import type { ProjectMember } from "../../../types";
import { postJson } from "../../client";

export type AddProjectMemberInput = {
  projectId: string;
  userId?: string;
  email?: string;
  role: string;
};

export function addProjectMember({ projectId, ...body }: AddProjectMemberInput) {
  return postJson<ProjectMember>(`/projects/${projectId}/members`, body);
}
