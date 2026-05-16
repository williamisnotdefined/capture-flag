# Good Management API Contract

Source: `apps/api/src/management-api/management-api-contract.ts` (sha256: `020a70dc12de6839d7865a8ceb4a540681ea597703b81ee355c08c5b405cadbf`)
Source: `apps/api/src/management-api/management-api-openapi.ts` (sha256: `70d39e4d03ecd18e900f4b9accd4b46aa0857920b65ef92512af42ec9863dfa3`)
Source: `apps/api/test/management-api-route-metadata.spec.ts` (sha256: `e66be56e794fb62486460a198fdcbcb31d603db7057c36a78b944545f6e622b9`)
Source: `apps/api/test/management-api-openapi.spec.ts` (sha256: `6ad25a1e675fd499fe095d31c7f74393eba589a4aea32ba9e8cd6a26995934ab`)

Why this is canonical:

- Keeps the Public Management API subset explicit instead of inferring support from controller routes.
- Keeps API token scopes, tenant metadata, auth mode, route paths, and OpenAPI output aligned.
- Preserves dual controller behavior where session requests can use the controller but API tokens need method-level scope metadata.
- Verifies that rate limiting runs before and after API token authentication.

## Contract Entry

```ts
{
  apiTokenAccess: "session-or-api-token",
  controller: "SegmentsController",
  handler: "update",
  method: "patch",
  path: "/api/v1/configs/{configId}/segments/{segmentId}",
  scopes: ["segments:write"],
  tenant: { configParam: "configId", segmentParam: "segmentId" },
}
```

Every API-token-supported route records auth mode, controller method, documented path, required scopes, and tenant identifiers.

## OpenAPI Filtering

```ts
for (const route of managementApiRoutes) {
  const routeMethods = routes[route.path] ?? {};
  routeMethods[route.method] = route.scopes;
  routes[route.path] = routeMethods;
}
```

The OpenAPI allowlist is derived from the route contract so unsupported session-only and public SDK routes stay out of `/api/v1/docs`.

## Metadata Tests

```ts
for (const route of managementApiRoutes) {
  expect(scopes(controllerFor(route.controller), route.handler)).toEqual(route.scopes);
  expect(tenantRequirement(controllerFor(route.controller), route.handler)).toEqual(route.tenant);
}
```

Tests keep controller decorators aligned with the contract. Non-contract methods on dual controllers must not define API token scope or tenant metadata.
