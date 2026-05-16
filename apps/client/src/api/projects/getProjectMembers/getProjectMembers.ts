import { apiRequest } from "@api/client";
import type { ProjectMember } from "@src/types";

export function getProjectMembers(projectId: string) {
  return apiRequest<ProjectMember[]>(`/projects/${projectId}/members`);
}
