import { describe, expect, it } from "vitest";
import {
  canManageFeatureFlags,
  canManageOrganizationMembers,
  canManageProjectResources,
  canManageSegments,
} from "../permissions";

describe("client RBAC permission helpers", () => {
  it("lets organization owners and admins manage organization members", () => {
    expect(canManageOrganizationMembers("owner")).toBe(true);
    expect(canManageOrganizationMembers("admin")).toBe(true);
    expect(canManageOrganizationMembers("member")).toBe(false);
    expect(canManageOrganizationMembers("viewer")).toBe(false);
  });

  it("lets developers manage flags but not segments or project resources", () => {
    expect(canManageFeatureFlags("member", "developer")).toBe(true);
    expect(canManageProjectResources("member", "developer")).toBe(false);
    expect(canManageSegments("member", "developer")).toBe(false);
  });

  it("lets project admins manage project resources and segments", () => {
    expect(canManageProjectResources("member", "project_admin")).toBe(true);
    expect(canManageSegments("member", "project_admin")).toBe(true);
  });

  it("keeps viewers read-only unless they are organization admins", () => {
    expect(canManageFeatureFlags("member", "viewer")).toBe(false);
    expect(canManageSegments("member", "viewer")).toBe(false);
    expect(canManageFeatureFlags("admin", null)).toBe(true);
    expect(canManageSegments("owner", null)).toBe(true);
  });
});
