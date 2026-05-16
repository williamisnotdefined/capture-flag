import type { Project } from "../../../types";
import { patchJson } from "../../client";

export type UpdateProjectInput = {
  name: string;
  projectId: string;
};

export function updateProject({ name, projectId }: UpdateProjectInput) {
  return patchJson<Project>(`/projects/${projectId}`, { name });
}
