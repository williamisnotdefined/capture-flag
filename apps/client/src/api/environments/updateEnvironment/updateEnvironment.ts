import type { Environment } from "../../../types";
import { patchJson } from "../../client";

export type UpdateEnvironmentInput = {
  environmentId: string;
  name: string;
};

export function updateEnvironment({ environmentId, name }: UpdateEnvironmentInput) {
  return patchJson<Environment>(`/environments/${environmentId}`, { name });
}
