import type { Config } from "../../../types";
import { postJson } from "../../client";

type CreateConfigInput = {
  description?: string;
  name: string;
  projectId: string;
};

export function createConfig({ description, name, projectId }: CreateConfigInput) {
  return postJson<Config>(`/projects/${projectId}/configs`, { description, name });
}

export type { CreateConfigInput };
