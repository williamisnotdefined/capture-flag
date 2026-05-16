import type { Config } from "../../../types";
import { patchJson } from "../../client";

export type UpdateConfigInput = {
  configId: string;
  description?: string;
  name?: string;
};

export function updateConfig({ configId, description, name }: UpdateConfigInput) {
  return patchJson<Config>(`/configs/${configId}`, { description, name });
}
