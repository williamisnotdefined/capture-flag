import { describe, expect, it } from "vitest";
import {
  canManageFeatureFlags,
  canManageOrganizationMembers,
  canManageProjectResources,
  canManageSegments,
  featureFlagManagerRoles,
  isOrganizationRole,
  isProjectRole,
  organizationManagerRoles,
  organizationRoles,
  projectManagerRoles,
  projectRoles,
  segmentManagerRoles,
} from "../src";

describe("shared roles and permission contract", () => {
  it("exports the canonical organization and project roles", () => {
    expect(organizationRoles).toEqual(["owner", "admin", "member", "viewer"]);
    expect(projectRoles).toEqual(["project_admin", "developer", "viewer"]);
    expect(organizationManagerRoles).toEqual(["owner", "admin"]);
    expect(projectManagerRoles).toEqual(["project_admin"]);
    expect(featureFlagManagerRoles).toEqual(["project_admin", "developer"]);
    expect(segmentManagerRoles).toEqual(["project_admin"]);
  });

  it("validates role values", () => {
    expect(isOrganizationRole("owner")).toBe(true);
    expect(isOrganizationRole("project_admin")).toBe(false);
    expect(isProjectRole("developer")).toBe(true);
    expect(isProjectRole("admin")).toBe(false);
  });

  it("lets organization owners and admins manage organization members", () => {
    expect(canManageOrganizationMembers("owner")).toBe(true);
    expect(canManageOrganizationMembers("admin")).toBe(true);
    expect(canManageOrganizationMembers("member")).toBe(false);
    expect(canManageOrganizationMembers("viewer")).toBe(false);
    expect(canManageOrganizationMembers(null)).toBe(false);
  });

  it("keeps developers scoped to feature flag management only", () => {
    const organizationRole = "member";
    const projectRole = "developer";

    expect(canManageFeatureFlags(organizationRole, projectRole)).toBe(true);
    expect(canManageProjectResources(organizationRole, projectRole)).toBe(false);
    expect(canManageSegments(organizationRole, projectRole)).toBe(false);

    const restrictedProjectResources = [
      "configs",
      "environments",
      "project members",
      "sdk keys",
      "segments",
    ];

    for (const resource of restrictedProjectResources) {
      expect(canManageProjectResources(organizationRole, projectRole), resource).toBe(false);
    }
  });

  it("lets project admins manage project resources and segments", () => {
    expect(canManageProjectResources("member", "project_admin")).toBe(true);
    expect(canManageSegments("member", "project_admin")).toBe(true);
  });

  it("keeps project viewers read-only unless they have an organization manager role", () => {
    expect(canManageFeatureFlags("member", "viewer")).toBe(false);
    expect(canManageProjectResources("member", "viewer")).toBe(false);
    expect(canManageSegments("member", "viewer")).toBe(false);
    expect(canManageFeatureFlags("admin", null)).toBe(true);
    expect(canManageProjectResources("owner", null)).toBe(true);
    expect(canManageSegments("owner", null)).toBe(true);
  });
});
