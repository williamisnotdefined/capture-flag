import { deleteJson } from "@api/client";

export function deleteProject(projectId: string) {
  return deleteJson<{ ok: true }>(`/projects/${projectId}`);
}
