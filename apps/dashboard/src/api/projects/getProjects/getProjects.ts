import type { Project } from "../../../types";
import { apiRequest } from "../../client";

export function getProjects(organizationId: string) {
  return apiRequest<Project[]>(`/organizations/${organizationId}/projects`);
}
