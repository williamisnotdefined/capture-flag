import type { SdkKey } from "../../../types";
import { apiRequest } from "../../client";

export function getProjectSdkKeys(projectId: string) {
  return apiRequest<SdkKey[]>(`/projects/${projectId}/sdk-keys`);
}
