import { deleteJson } from "../../client";

export function deleteProject(projectId: string) {
  return deleteJson<{ ok: true }>(`/projects/${projectId}`);
}
