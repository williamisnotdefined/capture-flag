import { patchJson } from "@api/client";
import type { Project } from "@src/types";

export type UpdateProjectInput = {
  name: string;
  projectId: string;
};

export function updateProject({ name, projectId }: UpdateProjectInput) {
  return patchJson<Project>(`/projects/${projectId}`, { name });
}
