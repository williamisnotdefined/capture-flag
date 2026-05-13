import type { ProjectMember } from "../../../types";
import { apiRequest } from "../../client";

export function getProjectMembers(projectId: string) {
  return apiRequest<ProjectMember[]>(`/projects/${projectId}/members`);
}
