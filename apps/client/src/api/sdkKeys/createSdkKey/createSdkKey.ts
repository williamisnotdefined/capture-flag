import type { SdkKey } from "../../../types";
import { postJson } from "../../client";

type CreateSdkKeyInput = {
  configId: string;
  environmentId: string;
  name?: string;
  projectId: string;
};

export function createSdkKey({ configId, environmentId, name, projectId }: CreateSdkKeyInput) {
  return postJson<SdkKey>(`/projects/${projectId}/sdk-keys`, { configId, environmentId, name });
}
