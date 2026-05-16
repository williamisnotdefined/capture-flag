import { patchJson } from "@api/client";
import type { Environment } from "@src/types";

export type UpdateEnvironmentInput = {
  environmentId: string;
  name: string;
};

export function updateEnvironment({ environmentId, name }: UpdateEnvironmentInput) {
  return patchJson<Environment>(`/environments/${environmentId}`, { name });
}
