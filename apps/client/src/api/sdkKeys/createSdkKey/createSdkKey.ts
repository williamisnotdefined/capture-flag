import { postJson } from "@api/client";
import type { SdkKey } from "@src/types";

type CreateSdkKeyInput = {
  configId: string;
  environmentId: string;
  name?: string;
  projectId: string;
};

export function createSdkKey({ configId, environmentId, name, projectId }: CreateSdkKeyInput) {
  return postJson<SdkKey>(`/projects/${projectId}/sdk-keys`, { configId, environmentId, name });
}
