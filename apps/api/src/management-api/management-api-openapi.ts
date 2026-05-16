import { managementApiRoutes } from "./management-api-contract";

type OpenApiMethod = (typeof openApiMethods)[number];
type OpenApiOperation = {
  description?: string;
  security?: Array<Record<string, string[]>>;
};
type OpenApiPathItem = Partial<Record<OpenApiMethod, OpenApiOperation>>;
type MutableOpenApiDocument = {
  paths: Record<string, OpenApiPathItem>;
};

const openApiMethods = [
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "options",
  "head",
  "trace",
] as const;

export const managementApiOpenApiRoutes = buildManagementApiOpenApiRoutes();

export function restrictOpenApiToManagementApi(document: MutableOpenApiDocument) {
  const paths = document.paths;

  for (const path of Object.keys(paths)) {
    const allowedMethods = managementApiOpenApiRoutes[path];
    const pathItem = paths[path];

    if (!allowedMethods) {
      delete paths[path];
      continue;
    }

    for (const method of openApiMethods) {
      const operation = pathItem[method];
      const requiredScopes = allowedMethods[method];

      if (!operation || !requiredScopes) {
        delete pathItem[method];
        continue;
      }

      operation.security = [{ "api-token": [] }];
      operation.description = appendOpenApiScopeDescription(operation.description, requiredScopes);
    }

    if (!openApiMethods.some((method) => pathItem[method])) {
      delete paths[path];
    }
  }
}

function appendOpenApiScopeDescription(description: string | undefined, scopes: readonly string[]) {
  const scopeDescription = `Required API token scopes: ${scopes.join(", ")}.`;
  return description ? `${description}\n\n${scopeDescription}` : scopeDescription;
}

function buildManagementApiOpenApiRoutes(): Record<
  string,
  Partial<Record<OpenApiMethod, readonly string[]>>
> {
  const routes: Record<string, Partial<Record<OpenApiMethod, readonly string[]>>> = {};

  for (const route of managementApiRoutes) {
    const routeMethods = routes[route.path] ?? {};
    routeMethods[route.method] = route.scopes;
    routes[route.path] = routeMethods;
  }

  return routes;
}
