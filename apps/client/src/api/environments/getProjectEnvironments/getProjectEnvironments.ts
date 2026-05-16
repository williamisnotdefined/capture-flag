import { apiRequest } from "@api/client";
import type { Environment } from "@src/types";

export function getProjectEnvironments(projectId: string) {
  return apiRequest<Environment[]>(`/projects/${projectId}/environments`);
}
