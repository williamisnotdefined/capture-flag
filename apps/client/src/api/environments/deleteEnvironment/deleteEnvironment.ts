import { deleteJson } from "@api/client";

export function deleteEnvironment(environmentId: string) {
  return deleteJson<{ ok: true }>(`/environments/${environmentId}`);
}
