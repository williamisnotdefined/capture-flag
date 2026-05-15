import type { OrganizationRole } from "../../../types";

export const ownerOrganizationRoles = [
  "owner",
  "admin",
  "member",
  "viewer",
] as const satisfies readonly OrganizationRole[];
export const adminOrganizationRoles = [
  "admin",
  "member",
  "viewer",
] as const satisfies readonly OrganizationRole[];
