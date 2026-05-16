import "reflect-metadata";
import { GUARDS_METADATA } from "@nestjs/common/constants";
import { apiTokenScopesMetadataKey } from "../src/api-tokens/api-token-scopes.decorator";
import { apiTokenTenantMetadataKey } from "../src/api-tokens/api-token-tenant.decorator";
import { ApiTokenGuard } from "../src/api-tokens/api-token.guard";
import { ManagementApiRateLimitGuard } from "../src/api-tokens/management-api-rate-limit.guard";
import { AuthenticatedApiGuard } from "../src/auth/authenticated-api.guard";
import { ConfigsController } from "../src/configs/configs.controller";
import { EnvironmentsController } from "../src/environments/environments.controller";
import { ManagementApiController } from "../src/management-api/management-api.controller";
import { OrganizationsController } from "../src/organizations/organizations.controller";
import { ProjectsController } from "../src/projects/projects.controller";
import { SegmentsController } from "../src/segments/segments.controller";

describe("management API route metadata", () => {
  it("runs rate limiting before bearer authentication on API-token-capable controllers", () => {
    expect(firstGuard(ManagementApiController)).toBe(ManagementApiRateLimitGuard);
    expect(firstGuard(ProjectsController)).toBe(ManagementApiRateLimitGuard);
    expect(firstGuard(ConfigsController)).toBe(ManagementApiRateLimitGuard);
    expect(firstGuard(OrganizationsController)).toBe(ManagementApiRateLimitGuard);
    expect(firstGuard(SegmentsController)).toBe(ManagementApiRateLimitGuard);
  });

  it("runs token-aware rate limiting after bearer authentication", () => {
    expect(guards(ManagementApiController).slice(0, 3)).toEqual([
      ManagementApiRateLimitGuard,
      ApiTokenGuard,
      ManagementApiRateLimitGuard,
    ]);
    for (const controller of [
      ProjectsController,
      ConfigsController,
      OrganizationsController,
      SegmentsController,
    ]) {
      expect(guards(controller).slice(0, 3)).toEqual([
        ManagementApiRateLimitGuard,
        AuthenticatedApiGuard,
        ManagementApiRateLimitGuard,
      ]);
    }
  });

  it("keeps API token scopes on documented Management API routes", () => {
    expect(scopes(ManagementApiController, "listProjects")).toEqual(["projects:read"]);
    expect(scopes(ManagementApiController, "createProject")).toEqual(["projects:write"]);
    expect(scopes(ManagementApiController, "listFlags")).toEqual(["flags:read"]);
    expect(scopes(ManagementApiController, "createFlag")).toEqual(["flags:write"]);
    expect(scopes(ManagementApiController, "updateFlag")).toEqual(["flags:write"]);
    expect(scopes(ManagementApiController, "listEnvironments")).toEqual(["environments:read"]);
    expect(scopes(ConfigsController, "list")).toEqual(["configs:read"]);
    expect(scopes(ConfigsController, "create")).toEqual(["configs:write"]);
    expect(scopes(OrganizationsController, "listMembers")).toEqual(["members:read"]);
    expect(scopes(OrganizationsController, "addMember")).toEqual(["members:write"]);
    expect(scopes(OrganizationsController, "updateMember")).toEqual(["members:write"]);
    expect(scopes(OrganizationsController, "removeMember")).toEqual(["members:write"]);
    expect(scopes(ProjectsController, "listMembers")).toEqual(["members:read"]);
    expect(scopes(ProjectsController, "addMember")).toEqual(["members:write"]);
    expect(scopes(SegmentsController, "list")).toEqual(["segments:read"]);
    expect(scopes(SegmentsController, "create")).toEqual(["segments:write"]);
    expect(scopes(SegmentsController, "update")).toEqual(["segments:write"]);
    expect(scopes(SegmentsController, "delete")).toEqual(["segments:write"]);
  });

  it("does not expose destructive or non-roadmap session routes to API tokens", () => {
    expect(scopes(ProjectsController, "get")).toBeUndefined();
    expect(scopes(ProjectsController, "update")).toBeUndefined();
    expect(scopes(ProjectsController, "delete")).toBeUndefined();
    expect(scopes(ProjectsController, "updateMember")).toBeUndefined();
    expect(scopes(ProjectsController, "removeMember")).toBeUndefined();
    expect(scopes(ConfigsController, "delete")).toBeUndefined();
    expect(scopes(EnvironmentsController, "list")).toBeUndefined();
  });

  it("removes tenant metadata from non-roadmap session routes", () => {
    expect(tenantRequirement(ProjectsController, "delete")).toBeUndefined();
    expect(tenantRequirement(ProjectsController, "updateMember")).toBeUndefined();
    expect(tenantRequirement(ProjectsController, "removeMember")).toBeUndefined();
    expect(tenantRequirement(ConfigsController, "delete")).toBeUndefined();
    expect(tenantRequirement(EnvironmentsController, "list")).toBeUndefined();
  });

  it("keeps tenant metadata on API-token organization member writes", () => {
    expect(tenantRequirement(ManagementApiController, "listFlags")).toEqual({
      configQuery: "configId",
    });
    expect(tenantRequirement(ManagementApiController, "createFlag")).toEqual({
      configBody: "configId",
    });
    expect(tenantRequirement(ManagementApiController, "updateFlag")).toEqual({
      featureFlagParam: "id",
    });
    expect(tenantRequirement(ManagementApiController, "listEnvironments")).toEqual({
      projectQuery: "projectId",
    });
    expect(tenantRequirement(ConfigsController, "list")).toEqual({
      projectParam: "projectId",
    });
    expect(tenantRequirement(ConfigsController, "create")).toEqual({
      projectParam: "projectId",
    });
    expect(tenantRequirement(OrganizationsController, "listMembers")).toEqual({
      organizationParam: "organizationId",
    });
    expect(tenantRequirement(OrganizationsController, "addMember")).toEqual({
      organizationParam: "organizationId",
    });
    expect(tenantRequirement(OrganizationsController, "updateMember")).toEqual({
      organizationParam: "organizationId",
    });
    expect(tenantRequirement(OrganizationsController, "removeMember")).toEqual({
      organizationParam: "organizationId",
    });
    expect(tenantRequirement(ProjectsController, "listMembers")).toEqual({
      projectParam: "projectId",
    });
    expect(tenantRequirement(ProjectsController, "addMember")).toEqual({
      projectParam: "projectId",
    });
    expect(tenantRequirement(SegmentsController, "list")).toEqual({
      configParam: "configId",
    });
    expect(tenantRequirement(SegmentsController, "create")).toEqual({
      configParam: "configId",
    });
    expect(tenantRequirement(SegmentsController, "update")).toEqual({
      configParam: "configId",
      segmentParam: "segmentId",
    });
    expect(tenantRequirement(SegmentsController, "delete")).toEqual({
      configParam: "configId",
      segmentParam: "segmentId",
    });
  });
});

function scopes(controller: object, methodName: string) {
  return Reflect.getMetadata(apiTokenScopesMetadataKey, controllerMethod(controller, methodName));
}

function tenantRequirement(controller: object, methodName: string) {
  return Reflect.getMetadata(apiTokenTenantMetadataKey, controllerMethod(controller, methodName));
}

function firstGuard(controller: object) {
  return guards(controller)[0];
}

function guards(controller: object) {
  return Reflect.getMetadata(GUARDS_METADATA, controller) ?? [];
}

function controllerMethod(controller: object, methodName: string): object {
  const method = (controller as { prototype: Record<string, unknown> }).prototype[methodName];
  if (typeof method !== "function") {
    throw new Error(`Missing controller method: ${methodName}`);
  }

  return method;
}
