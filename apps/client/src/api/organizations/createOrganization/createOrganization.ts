import type { Organization } from "../../../types";
import { postJson } from "../../client";

export function createOrganization(name: string) {
  return postJson<Organization>("/organizations", { name });
}
