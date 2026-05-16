import "reflect-metadata";
import { RequestMethod } from "@nestjs/common";
import { GUARDS_METADATA, METHOD_METADATA, PATH_METADATA } from "@nestjs/common/constants";
import { apiTokenScopesMetadataKey } from "../src/api-tokens/api-token-scopes.decorator";
import { apiTokenTenantMetadataKey } from "../src/api-tokens/api-token-tenant.decorator";
import { ApiTokenGuard } from "../src/api-tokens/api-token.guard";
import { ManagementApiRateLimitGuard } from "../src/api-tokens/management-api-rate-limit.guard";
import { AuthenticatedApiGuard } from "../src/auth/authenticated-api.guard";
import { ConfigsController } from "../src/configs/configs.controller";
import { EnvironmentsController } from "../src/environments/environments.controller";
import {
  type ManagementApiControllerName,
  type ManagementApiHttpMethod,
  managementApiRoutes,
} from "../src/management-api/management-api-contract";
import { ManagementApiController } from "../src/management-api/management-api.controller";
import { OrganizationsController } from "../src/organizations/organizations.controller";
import { ProjectsController } from "../src/projects/projects.controller";
import { SegmentsController } from "../src/segments/segments.controller";

const requestMethodByHttpMethod: Record<ManagementApiHttpMethod, RequestMethod> = {
  delete: RequestMethod.DELETE,
  get: RequestMethod.GET,
  patch: RequestMethod.PATCH,
  post: RequestMethod.POST,
};

const managementApiControllers = {
  ConfigsController,
  ManagementApiController,
  OrganizationsController,
  ProjectsController,
  SegmentsController,
} as const satisfies Record<ManagementApiControllerName, object>;

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
    for (const route of managementApiRoutes) {
      expect(scopes(controllerFor(route.controller), route.handler)).toEqual(route.scopes);
    }
  });

  it("keeps the Management API contract aligned with controller routes", () => {
    for (const route of managementApiRoutes) {
      const controller = controllerFor(route.controller);
      expect(httpMethod(controller, route.handler)).toBe(requestMethodByHttpMethod[route.method]);
      expect(openApiPath(controller, route.handler)).toBe(route.path);
    }
  });

  it("keeps the Management API contract aligned with controller auth mode", () => {
    for (const route of managementApiRoutes) {
      const controllerGuards = guards(controllerFor(route.controller));

      if (route.apiTokenAccess === "api-token-only") {
        expect(controllerGuards).toContain(ApiTokenGuard);
        expect(controllerGuards).not.toContain(AuthenticatedApiGuard);
        continue;
      }

      expect(controllerGuards).toContain(AuthenticatedApiGuard);
      expect(controllerGuards).not.toContain(ApiTokenGuard);
    }
  });

  it("keeps non-contract routes on dual controllers session-only", () => {
    const contractMethods = contractMethodsByController();

    for (const controller of [
      ConfigsController,
      OrganizationsController,
      ProjectsController,
      SegmentsController,
    ]) {
      const controllerMethods = contractMethods.get(controller.name) ?? new Set<string>();

      for (const methodName of routeMethodNames(controller)) {
        if (controllerMethods.has(methodName)) {
          continue;
        }

        expect(scopes(controller, methodName)).toBeUndefined();
        expect(tenantRequirement(controller, methodName)).toBeUndefined();
      }
    }

    expect(scopes(EnvironmentsController, "list")).toBeUndefined();
    expect(tenantRequirement(EnvironmentsController, "list")).toBeUndefined();
  });

  it("keeps tenant metadata on documented Management API routes", () => {
    for (const route of managementApiRoutes) {
      expect(tenantRequirement(controllerFor(route.controller), route.handler)).toEqual(
        route.tenant,
      );
    }
  });
});

function controllerFor(controllerName: ManagementApiControllerName): object {
  return managementApiControllers[controllerName];
}

function contractMethodsByController() {
  const methods = new Map<string, Set<string>>();

  for (const route of managementApiRoutes) {
    const controllerMethods = methods.get(route.controller) ?? new Set<string>();
    controllerMethods.add(route.handler);
    methods.set(route.controller, controllerMethods);
  }

  return methods;
}

function routeMethodNames(controller: object) {
  return Object.getOwnPropertyNames((controller as { prototype: object }).prototype).filter(
    (name) => name !== "constructor",
  );
}

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

function httpMethod(controller: object, methodName: string) {
  return Reflect.getMetadata(METHOD_METADATA, controllerMethod(controller, methodName));
}

function openApiPath(controller: object, methodName: string) {
  return toOpenApiPath(
    joinPaths(
      metadataPath(Reflect.getMetadata(PATH_METADATA, controller)),
      metadataPath(Reflect.getMetadata(PATH_METADATA, controllerMethod(controller, methodName))),
    ),
  );
}

function controllerMethod(controller: object, methodName: string): object {
  const method = (controller as { prototype: Record<string, unknown> }).prototype[methodName];
  if (typeof method !== "function") {
    throw new Error(`Missing controller method: ${methodName}`);
  }

  return method;
}

function metadataPath(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }

  return "";
}

function joinPaths(...paths: string[]) {
  return `/${paths.filter(Boolean).join("/")}`.replace(/\/+/g, "/");
}

function toOpenApiPath(path: string) {
  return path.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}
