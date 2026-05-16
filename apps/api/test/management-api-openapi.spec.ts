import { managementApiRoutes } from "../src/management-api/management-api-contract";
import {
  managementApiOpenApiRoutes,
  restrictOpenApiToManagementApi,
} from "../src/management-api/management-api-openapi";

describe("management API OpenAPI filtering", () => {
  it("derives documented routes and scopes from the Management API contract", () => {
    const expectedOperationCount = managementApiRoutes.length;
    const actualOperationCount = Object.values(managementApiOpenApiRoutes).reduce(
      (count, methods) => count + Object.keys(methods).length,
      0,
    );

    expect(actualOperationCount).toBe(expectedOperationCount);
    for (const route of managementApiRoutes) {
      expect(managementApiOpenApiRoutes[route.path]?.[route.method]).toEqual(route.scopes);
    }
  });

  it("keeps only documented management paths and methods", () => {
    const document = {
      paths: {
        "/api/v1/auth/me": {
          get: {},
        },
        "/api/v1/organizations/{organizationId}/members": {
          get: {},
          post: {},
          put: {},
        },
        "/api/v1/organizations/{organizationId}/members/{memberId}": {
          delete: {},
          get: {},
          patch: {},
        },
        "/api/v1/projects": {
          delete: {},
          get: {},
          post: {},
        },
        "/api/v1/projects/{projectId}/members": {
          get: {},
          patch: {},
          post: {},
        },
        "/api/v1/projects/{projectId}/members/{memberId}": {
          delete: {},
          patch: {},
        },
      },
    };

    restrictOpenApiToManagementApi(document);

    expect(document.paths).not.toHaveProperty("/api/v1/auth/me");
    expect(document.paths["/api/v1/projects"]).not.toHaveProperty("delete");
    expect(document.paths["/api/v1/organizations/{organizationId}/members"]).not.toHaveProperty(
      "put",
    );
    expect(
      document.paths["/api/v1/organizations/{organizationId}/members/{memberId}"],
    ).not.toHaveProperty("get");
    expect(
      document.paths["/api/v1/organizations/{organizationId}/members/{memberId}"],
    ).toHaveProperty("patch");
    expect(
      document.paths["/api/v1/organizations/{organizationId}/members/{memberId}"],
    ).toHaveProperty("delete");
    expect(document.paths["/api/v1/projects/{projectId}/members"]).toHaveProperty("get");
    expect(document.paths["/api/v1/projects/{projectId}/members"]).toHaveProperty("post");
    expect(document.paths["/api/v1/projects/{projectId}/members"]).not.toHaveProperty("patch");
    expect(document.paths).not.toHaveProperty("/api/v1/projects/{projectId}/members/{memberId}");
  });

  it("adds bearer security and required scope descriptions", () => {
    const document = {
      paths: {
        "/api/v1/flags": {
          get: { description: "List feature flags." },
          post: {},
        },
      },
    };

    restrictOpenApiToManagementApi(document);

    expect(document.paths["/api/v1/flags"].get).toEqual({
      description: "List feature flags.\n\nRequired API token scopes: flags:read.",
      security: [{ "api-token": [] }],
    });
    expect(document.paths["/api/v1/flags"].post).toEqual({
      description: "Required API token scopes: flags:write.",
      security: [{ "api-token": [] }],
    });
  });
});
