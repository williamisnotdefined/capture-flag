import { apiRequest } from "@api/client";
import type { Config } from "@src/types";

export function getProjectConfigs(projectId: string) {
  return apiRequest<Config[]>(`/projects/${projectId}/configs`);
}
