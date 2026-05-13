import type { Environment } from "../../../types";
import { apiRequest } from "../../client";

export function getProjectEnvironments(projectId: string) {
  return apiRequest<Environment[]>(`/projects/${projectId}/environments`);
}
