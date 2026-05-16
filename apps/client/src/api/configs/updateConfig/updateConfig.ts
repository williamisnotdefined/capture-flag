import { patchJson } from "@api/client";
import type { Config } from "@src/types";

export type UpdateConfigInput = {
  configId: string;
  description?: string;
  name?: string;
};

export function updateConfig({ configId, description, name }: UpdateConfigInput) {
  return patchJson<Config>(`/configs/${configId}`, { description, name });
}
