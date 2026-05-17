import { deleteJson } from "@api/client";

export function deleteConfig(configId: string) {
  return deleteJson<{ ok: true }>(`/configs/${configId}`);
}
