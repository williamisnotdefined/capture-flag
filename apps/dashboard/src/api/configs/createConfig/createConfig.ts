import type { Config } from "../../../types";
import { postJson } from "../../client";

type CreateConfigInput = {
  name: string;
  projectId: string;
};

export function createConfig({ name, projectId }: CreateConfigInput) {
  return postJson<Config>(`/projects/${projectId}/configs`, { name });
}
