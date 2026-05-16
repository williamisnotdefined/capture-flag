import { postJson } from "@api/client";
import type { Project } from "@src/types";

type CreateProjectInput = {
  name: string;
  organizationId: string;
};

export function createProject({ name, organizationId }: CreateProjectInput) {
  return postJson<Project>(`/organizations/${organizationId}/projects`, { name });
}
