import type { ApiTokenTenantRequirement } from "../api-tokens/api-token-tenant.decorator";
import type { ApiTokenScope } from "../common/api-token-scopes";

export const managementApiHttpMethods = ["get", "post", "patch", "delete"] as const;

export type ManagementApiHttpMethod = (typeof managementApiHttpMethods)[number];

export type ManagementApiControllerName =
  | "ConfigsController"
  | "ManagementApiController"
  | "OrganizationsController"
  | "ProjectsController"
  | "SegmentsController";

export type ManagementApiRouteContract = {
  apiTokenAccess: "api-token-only" | "session-or-api-token";
  controller: ManagementApiControllerName;
  handler: string;
  method: ManagementApiHttpMethod;
  path: `/api/v1/${string}`;
  scopes: readonly ApiTokenScope[];
  tenant?: ApiTokenTenantRequirement;
};

export const managementApiRoutes = [
  {
    apiTokenAccess: "api-token-only",
    controller: "ManagementApiController",
    handler: "listProjects",
    method: "get",
    path: "/api/v1/projects",
    scopes: ["projects:read"],
  },
  {
    apiTokenAccess: "api-token-only",
    controller: "ManagementApiController",
    handler: "createProject",
    method: "post",
    path: "/api/v1/projects",
    scopes: ["projects:write"],
  },
  {
    apiTokenAccess: "api-token-only",
    controller: "ManagementApiController",
    handler: "listFlags",
    method: "get",
    path: "/api/v1/flags",
    scopes: ["flags:read"],
    tenant: { configQuery: "configId" },
  },
  {
    apiTokenAccess: "api-token-only",
    controller: "ManagementApiController",
    handler: "createFlag",
    method: "post",
    path: "/api/v1/flags",
    scopes: ["flags:write"],
    tenant: { configBody: "configId" },
  },
  {
    apiTokenAccess: "api-token-only",
    controller: "ManagementApiController",
    handler: "updateFlag",
    method: "patch",
    path: "/api/v1/flags/{id}",
    scopes: ["flags:write"],
    tenant: { featureFlagParam: "id" },
  },
  {
    apiTokenAccess: "api-token-only",
    controller: "ManagementApiController",
    handler: "listEnvironments",
    method: "get",
    path: "/api/v1/environments",
    scopes: ["environments:read"],
    tenant: { projectQuery: "projectId" },
  },
  {
    apiTokenAccess: "session-or-api-token",
    controller: "ConfigsController",
    handler: "list",
    method: "get",
    path: "/api/v1/projects/{projectId}/configs",
    scopes: ["configs:read"],
    tenant: { projectParam: "projectId" },
  },
  {
    apiTokenAccess: "session-or-api-token",
    controller: "ConfigsController",
    handler: "create",
    method: "post",
    path: "/api/v1/projects/{projectId}/configs",
    scopes: ["configs:write"],
    tenant: { projectParam: "projectId" },
  },
  {
    apiTokenAccess: "session-or-api-token",
    controller: "OrganizationsController",
    handler: "listMembers",
    method: "get",
    path: "/api/v1/organizations/{organizationId}/members",
    scopes: ["members:read"],
    tenant: { organizationParam: "organizationId" },
  },
  {
    apiTokenAccess: "session-or-api-token",
    controller: "OrganizationsController",
    handler: "addMember",
    method: "post",
    path: "/api/v1/organizations/{organizationId}/members",
    scopes: ["members:write"],
    tenant: { organizationParam: "organizationId" },
  },
  {
    apiTokenAccess: "session-or-api-token",
    controller: "OrganizationsController",
    handler: "updateMember",
    method: "patch",
    path: "/api/v1/organizations/{organizationId}/members/{memberId}",
    scopes: ["members:write"],
    tenant: { organizationParam: "organizationId" },
  },
  {
    apiTokenAccess: "session-or-api-token",
    controller: "OrganizationsController",
    handler: "removeMember",
    method: "delete",
    path: "/api/v1/organizations/{organizationId}/members/{memberId}",
    scopes: ["members:write"],
    tenant: { organizationParam: "organizationId" },
  },
  {
    apiTokenAccess: "session-or-api-token",
    controller: "ProjectsController",
    handler: "listMembers",
    method: "get",
    path: "/api/v1/projects/{projectId}/members",
    scopes: ["members:read"],
    tenant: { projectParam: "projectId" },
  },
  {
    apiTokenAccess: "session-or-api-token",
    controller: "ProjectsController",
    handler: "addMember",
    method: "post",
    path: "/api/v1/projects/{projectId}/members",
    scopes: ["members:write"],
    tenant: { projectParam: "projectId" },
  },
  {
    apiTokenAccess: "session-or-api-token",
    controller: "SegmentsController",
    handler: "list",
    method: "get",
    path: "/api/v1/configs/{configId}/segments",
    scopes: ["segments:read"],
    tenant: { configParam: "configId" },
  },
  {
    apiTokenAccess: "session-or-api-token",
    controller: "SegmentsController",
    handler: "create",
    method: "post",
    path: "/api/v1/configs/{configId}/segments",
    scopes: ["segments:write"],
    tenant: { configParam: "configId" },
  },
  {
    apiTokenAccess: "session-or-api-token",
    controller: "SegmentsController",
    handler: "update",
    method: "patch",
    path: "/api/v1/configs/{configId}/segments/{segmentId}",
    scopes: ["segments:write"],
    tenant: { configParam: "configId", segmentParam: "segmentId" },
  },
  {
    apiTokenAccess: "session-or-api-token",
    controller: "SegmentsController",
    handler: "delete",
    method: "delete",
    path: "/api/v1/configs/{configId}/segments/{segmentId}",
    scopes: ["segments:write"],
    tenant: { configParam: "configId", segmentParam: "segmentId" },
  },
] as const satisfies readonly ManagementApiRouteContract[];
