import { postJson } from "@api/client";
import type { Organization } from "@src/types";

export function createOrganization(name: string) {
  return postJson<Organization>("/organizations", { name });
}
