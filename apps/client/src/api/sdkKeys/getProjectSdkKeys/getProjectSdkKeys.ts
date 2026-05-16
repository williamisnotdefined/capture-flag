import { apiRequest } from "@api/client";
import type { SdkKey } from "@src/types";

export function getProjectSdkKeys(projectId: string) {
  return apiRequest<SdkKey[]>(`/projects/${projectId}/sdk-keys`);
}
