import type { Environment } from "../../../types";
import { postJson } from "../../client";

type CreateEnvironmentInput = {
  name: string;
  projectId: string;
};

export function createEnvironment({ name, projectId }: CreateEnvironmentInput) {
  return postJson<Environment>(`/projects/${projectId}/environments`, { name });
}
