import type { OrganizationRole, ProjectRole } from "../../types";

export function canManageOrganizationMembers(role: OrganizationRole | null | undefined) {
  return role === "owner" || role === "admin";
}

export function canManageProjectResources(
  organizationRole: OrganizationRole | null | undefined,
  projectRole: ProjectRole | null | undefined,
) {
  return canManageOrganizationMembers(organizationRole) || projectRole === "project_admin";
}

export function canManageFeatureFlags(
  organizationRole: OrganizationRole | null | undefined,
  projectRole: ProjectRole | null | undefined,
) {
  return canManageProjectResources(organizationRole, projectRole) || projectRole === "developer";
}

export function canManageSegments(
  organizationRole: OrganizationRole | null | undefined,
  projectRole: ProjectRole | null | undefined,
) {
  return canManageProjectResources(organizationRole, projectRole);
}
