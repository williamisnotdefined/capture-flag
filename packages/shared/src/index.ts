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

function includesRole<Role extends string>(roles: readonly Role[], value: unknown): value is Role {
  return typeof value === "string" && roles.some((role) => role === value);
}

export function isOrganizationRole(value: unknown): value is OrganizationRole {
  return includesRole(organizationRoles, value);
}

export function isProjectRole(value: unknown): value is ProjectRole {
  return includesRole(projectRoles, value);
}

export function canManageOrganizationMembers(role: OrganizationRole | null | undefined) {
  return includesRole(organizationManagerRoles, role);
}

export function canManageProjectResources(
  organizationRole: OrganizationRole | null | undefined,
  projectRole: ProjectRole | null | undefined,
) {
  return (
    canManageOrganizationMembers(organizationRole) || includesRole(projectManagerRoles, projectRole)
  );
}

export function canManageFeatureFlags(
  organizationRole: OrganizationRole | null | undefined,
  projectRole: ProjectRole | null | undefined,
) {
  return (
    canManageOrganizationMembers(organizationRole) ||
    includesRole(featureFlagManagerRoles, projectRole)
  );
}

export function canManageSegments(
  organizationRole: OrganizationRole | null | undefined,
  projectRole: ProjectRole | null | undefined,
) {
  return (
    canManageOrganizationMembers(organizationRole) || includesRole(segmentManagerRoles, projectRole)
  );
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}
