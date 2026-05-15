export const organizationRoles = ["owner", "admin", "member", "viewer"] as const;
export const projectRoles = ["project_admin", "developer", "viewer"] as const;

export type OrganizationRole = (typeof organizationRoles)[number];
export type ProjectRole = (typeof projectRoles)[number];

export const organizationManagerRoles = [
  "owner",
  "admin",
] as const satisfies readonly OrganizationRole[];
export const projectManagerRoles = ["project_admin"] as const satisfies readonly ProjectRole[];
export const featureFlagManagerRoles = [
  "project_admin",
  "developer",
] as const satisfies readonly ProjectRole[];
export const segmentManagerRoles = ["project_admin"] as const satisfies readonly ProjectRole[];

export function isOrganizationRole(value: unknown): value is OrganizationRole {
  return typeof value === "string" && organizationRoles.includes(value as OrganizationRole);
}

export function isProjectRole(value: unknown): value is ProjectRole {
  return typeof value === "string" && projectRoles.includes(value as ProjectRole);
}
