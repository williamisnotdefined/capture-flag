import type { Config } from "../../../types";
import { apiRequest } from "../../client";

export function getProjectConfigs(projectId: string) {
  return apiRequest<Config[]>(`/projects/${projectId}/configs`);
}
