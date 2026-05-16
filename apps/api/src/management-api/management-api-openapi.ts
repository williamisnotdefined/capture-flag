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

export const managementApiOpenApiRoutes: Record<
  string,
  Partial<Record<OpenApiMethod, readonly string[]>>
> = {
  "/api/v1/configs/{configId}/segments": {
    get: ["segments:read"],
    post: ["segments:write"],
  },
  "/api/v1/configs/{configId}/segments/{segmentId}": {
    delete: ["segments:write"],
    patch: ["segments:write"],
  },
  "/api/v1/environments": {
    get: ["environments:read"],
  },
  "/api/v1/flags": {
    get: ["flags:read"],
    post: ["flags:write"],
  },
  "/api/v1/flags/{id}": {
    patch: ["flags:write"],
  },
  "/api/v1/organizations/{organizationId}/members": {
    get: ["members:read"],
    post: ["members:write"],
  },
  "/api/v1/organizations/{organizationId}/members/{memberId}": {
    delete: ["members:write"],
    patch: ["members:write"],
  },
  "/api/v1/projects": {
    get: ["projects:read"],
    post: ["projects:write"],
  },
  "/api/v1/projects/{projectId}/configs": {
    get: ["configs:read"],
    post: ["configs:write"],
  },
  "/api/v1/projects/{projectId}/members": {
    get: ["members:read"],
    post: ["members:write"],
  },
};

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
