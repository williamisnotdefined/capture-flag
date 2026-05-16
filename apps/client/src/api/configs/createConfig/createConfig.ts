import { postJson } from "@api/client";
import type { Config } from "@src/types";

type CreateConfigInput = {
  description?: string;
  name: string;
  projectId: string;
};

export function createConfig({ description, name, projectId }: CreateConfigInput) {
  return postJson<Config>(`/projects/${projectId}/configs`, { description, name });
}

export type { CreateConfigInput };
