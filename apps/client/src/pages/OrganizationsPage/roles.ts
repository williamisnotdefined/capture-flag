import { type OrganizationRole, organizationRoles } from "@capture-flag/shared";

export const ownerOrganizationRoles = organizationRoles;
export const adminOrganizationRoles = organizationRoles.filter(
  (role) => role !== "owner",
) as readonly Exclude<OrganizationRole, "owner">[];
