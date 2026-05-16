import { apiRequest } from "@api/client";
import type { Project } from "@src/types";

export function getProjects(organizationId: string) {
  return apiRequest<Project[]>(`/organizations/${organizationId}/projects`);
}
