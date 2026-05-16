import { postJson } from "@api/client";
import type { Environment } from "@src/types";

type CreateEnvironmentInput = {
  name: string;
  projectId: string;
};

export function createEnvironment({ name, projectId }: CreateEnvironmentInput) {
  return postJson<Environment>(`/projects/${projectId}/environments`, { name });
}
