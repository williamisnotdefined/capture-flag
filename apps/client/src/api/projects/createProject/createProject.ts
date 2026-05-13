import type { Project } from "../../../types";
import { postJson } from "../../client";

type CreateProjectInput = {
  name: string;
  organizationId: string;
};

export function createProject({ name, organizationId }: CreateProjectInput) {
  return postJson<Project>(`/organizations/${organizationId}/projects`, { name });
}
