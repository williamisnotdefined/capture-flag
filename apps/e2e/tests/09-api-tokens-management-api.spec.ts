import { type APIRequestContext, type APIResponse, expect, test } from "@playwright/test";
import { apiUrl, authHeaders, expectJson } from "../support/api";
import {
  type ApiTokenScope,
  apiTokenHeaders,
  createApiTokenViaApi,
  createExpiredApiTokenViaDb,
  listApiTokensViaApi,
  revokeApiTokenViaApi,
} from "../support/api-tokens";
import { createAuthenticatedUser } from "../support/auth";
import { disconnectDatabase } from "../support/db";
import { createFeatureFlagViaApi } from "../support/feature-flags";
import { addOrganizationMemberViaApi, listAuditLogsViaApi } from "../support/members";
import { resetDatabase } from "../support/reset";
import {
  type Config,
  type Environment,
  type Organization,
  type Project,
  createConfigViaApi,
  createCoreWorkspace,
  createEnvironmentViaApi,
  createProjectViaApi,
} from "../support/workspace";

type ApiError = {
  error: string;
  message: string;
  statusCode: number;
};

type ManagementFlag = {
  id: string;
  key: string;
  name: string;
  type: string;
};

type ManagementWorkspace = {
  config: Config;
  environment: Environment;
  organization: Organization;
  project: Project;
  sessionToken: string;
  user: { id: string };
};

const allManagementScopes: ApiTokenScope[] = [
  "projects:read",
  "projects:write",
  "flags:read",
  "flags:write",
  "environments:read",
];

test.beforeEach(async () => {
  await resetDatabase();
});

test.afterAll(async () => {
  await disconnectDatabase();
});

test("creates, lists, revokes, and audits API tokens without re-exposing raw tokens", async ({
  request,
}) => {
  const workspace = await createManagementWorkspace(request, {
    configKey: "api-token-lifecycle-config",
    projectSlug: "api-token-lifecycle-project",
    userEmail: "api-token-lifecycle@capture-flag.test",
  });

  const apiToken = await createApiTokenViaApi(
    request,
    workspace.sessionToken,
    workspace.organization.id,
    {
      name: "Lifecycle Automation Token",
      scopes: ["projects:read"],
    },
  );
  expect(apiToken).toMatchObject({
    lastUsedAt: null,
    name: "Lifecycle Automation Token",
    organizationId: workspace.organization.id,
    projectId: null,
    revokedAt: null,
    scopes: ["projects:read"],
  });
  expect(apiToken.token).toMatch(/^cf_api_/);
  expect(apiToken.tokenPrefix).toBe(apiToken.token?.slice(0, 18));

  let listedTokens = await listApiTokensViaApi(
    request,
    workspace.sessionToken,
    workspace.organization.id,
  );
  expect(listedTokens).toHaveLength(1);
  expect(listedTokens[0]).toMatchObject({
    id: apiToken.id,
    tokenPrefix: apiToken.tokenPrefix,
  });
  expect("token" in listedTokens[0]).toBe(false);

  await expect(
    managementGetJson<Project[]>(request, "/api/v1/projects", apiToken.token ?? ""),
  ).resolves.toEqual(
    expect.arrayContaining([expect.objectContaining({ id: workspace.project.id })]),
  );

  listedTokens = await listApiTokensViaApi(
    request,
    workspace.sessionToken,
    workspace.organization.id,
  );
  expect(listedTokens[0]).toMatchObject({ id: apiToken.id, lastUsedAt: expect.any(String) });

  const revokedToken = await revokeApiTokenViaApi(request, workspace.sessionToken, apiToken.id);
  expect(revokedToken).toMatchObject({
    id: apiToken.id,
    revokedAt: expect.any(String),
    tokenPrefix: apiToken.tokenPrefix,
  });
  expect("token" in revokedToken).toBe(false);

  await expectUnauthorized(
    request.get(apiUrl("/api/v1/projects"), {
      headers: apiTokenHeaders(apiToken.token ?? ""),
    }),
    "Invalid API token",
  );

  const secondRevokeError = await expectJson<ApiError>(
    await request.post(apiUrl(`/api/v1/api-tokens/${apiToken.id}/revoke`), {
      data: {},
      headers: authHeaders(workspace.sessionToken),
    }),
    400,
  );
  expect(secondRevokeError).toMatchObject({
    message: "API token is already revoked",
    statusCode: 400,
  });

  const auditLogs = await listAuditLogsViaApi(
    request,
    workspace.sessionToken,
    workspace.organization.id,
    {
      entityType: "api_token",
    },
  );
  expect(auditLogs.items.map((log) => log.action)).toEqual(
    expect.arrayContaining(["api_token.created", "api_token.revoked"]),
  );
  const serializedLogs = JSON.stringify(auditLogs.items);
  expect(serializedLogs).toContain(apiToken.tokenPrefix);
  expect(serializedLogs).not.toContain(apiToken.token ?? "missing-raw-token");
});

test("rejects missing, invalid, expired, and insufficient-scope management tokens", async ({
  request,
}) => {
  const workspace = await createManagementWorkspace(request, {
    configKey: "api-token-auth-config",
    projectSlug: "api-token-auth-project",
    userEmail: "api-token-auth@capture-flag.test",
  });
  const readOnlyToken = await createApiTokenViaApi(
    request,
    workspace.sessionToken,
    workspace.organization.id,
    {
      name: "Read Only Token",
      scopes: ["projects:read"],
    },
  );
  const expiredToken = await createExpiredApiTokenViaDb({
    organizationId: workspace.organization.id,
    scopes: ["projects:read"],
    userId: workspace.user.id,
  });

  await expectUnauthorized(request.get(apiUrl("/api/v1/projects")), "Missing API token");
  await expectUnauthorized(
    request.get(apiUrl("/api/v1/projects"), {
      headers: apiTokenHeaders("cf_api_invalid_token"),
    }),
    "Invalid API token",
  );
  await expectUnauthorized(
    request.get(apiUrl("/api/v1/projects"), {
      headers: apiTokenHeaders(expiredToken.rawToken),
    }),
    "Invalid API token",
  );

  const insufficientScopeError = await expectJson<ApiError>(
    await request.post(apiUrl("/api/v1/projects"), {
      data: { name: "Forbidden Project", slug: "forbidden-project" },
      headers: apiTokenHeaders(readOnlyToken.token ?? ""),
    }),
    403,
  );
  expect(insufficientScopeError).toMatchObject({
    message: "API token scope is not allowed for this action",
    statusCode: 403,
  });
});

test("enforces API token management roles and project ownership", async ({ request }) => {
  const workspace = await createManagementWorkspace(request, {
    configKey: "api-token-role-config",
    projectSlug: "api-token-role-project",
    userEmail: "api-token-role@capture-flag.test",
  });
  const otherWorkspace = await createManagementWorkspace(request, {
    configKey: "api-token-other-config",
    projectSlug: "api-token-other-project",
    userEmail: "api-token-other@capture-flag.test",
  });
  const managedToken = await createApiTokenViaApi(
    request,
    workspace.sessionToken,
    workspace.organization.id,
    {
      name: "Managed Token",
      scopes: ["projects:read"],
    },
  );
  const memberAuth = await createAuthenticatedUser({
    email: "api-token-member@capture-flag.test",
    name: "API Token Member",
  });
  await addOrganizationMemberViaApi(request, workspace.sessionToken, workspace.organization.id, {
    role: "member",
    userId: memberAuth.user.id,
  });

  await expectOrganizationRoleDenied(
    request.get(apiUrl(`/api/v1/organizations/${workspace.organization.id}/api-tokens`), {
      headers: authHeaders(memberAuth.sessionToken),
    }),
  );
  await expectOrganizationRoleDenied(
    request.post(apiUrl(`/api/v1/organizations/${workspace.organization.id}/api-tokens`), {
      data: { name: "Forbidden Token", scopes: ["projects:read"] },
      headers: authHeaders(memberAuth.sessionToken),
    }),
  );
  await expectOrganizationRoleDenied(
    request.post(apiUrl(`/api/v1/api-tokens/${managedToken.id}/revoke`), {
      data: {},
      headers: authHeaders(memberAuth.sessionToken),
    }),
  );

  const crossTenantProjectError = await expectJson<ApiError>(
    await request.post(apiUrl(`/api/v1/organizations/${workspace.organization.id}/api-tokens`), {
      data: {
        name: "Cross Tenant Project Token",
        projectId: otherWorkspace.project.id,
        scopes: ["projects:read"],
      },
      headers: authHeaders(workspace.sessionToken),
    }),
    404,
  );
  expect(crossTenantProjectError).toMatchObject({ message: "Project not found", statusCode: 404 });
});

test("allows organization-scoped management tokens to manage projects, environments, and flags", async ({
  request,
}) => {
  const workspace = await createManagementWorkspace(request, {
    configKey: "management-org-config",
    projectSlug: "management-org-project",
    userEmail: "management-org@capture-flag.test",
  });
  const apiToken = await createApiTokenViaApi(
    request,
    workspace.sessionToken,
    workspace.organization.id,
    {
      name: "Organization Management Token",
      scopes: allManagementScopes,
    },
  );
  const rawToken = apiToken.token ?? "";

  await expect(
    managementGetJson<Project[]>(request, "/api/v1/projects", rawToken),
  ).resolves.toEqual(
    expect.arrayContaining([expect.objectContaining({ id: workspace.project.id })]),
  );

  const createdProject = await managementPostJson<Project>(request, "/api/v1/projects", rawToken, {
    name: "Management Created Project",
    slug: "management-created-project",
  });
  expect(createdProject).toMatchObject({
    organizationId: workspace.organization.id,
    slug: "management-created-project",
  });

  await expect(
    managementGetJson<Environment[]>(
      request,
      `/api/v1/environments?projectId=${workspace.project.id}`,
      rawToken,
    ),
  ).resolves.toEqual(
    expect.arrayContaining([expect.objectContaining({ id: workspace.environment.id })]),
  );
  await expect(
    managementGetJson<ManagementFlag[]>(
      request,
      `/api/v1/flags?configId=${workspace.config.id}`,
      rawToken,
    ),
  ).resolves.toEqual([]);

  const flag = await managementPostJson<ManagementFlag>(request, "/api/v1/flags", rawToken, {
    configId: workspace.config.id,
    defaultValue: false,
    key: "management-created-flag",
    name: "Management Created Flag",
    type: "boolean",
  });
  expect(flag).toMatchObject({ key: "management-created-flag", name: "Management Created Flag" });

  const updatedFlag = await managementPatchJson<ManagementFlag>(
    request,
    `/api/v1/flags/${flag.id}`,
    rawToken,
    {
      name: "Management Updated Flag",
    },
  );
  expect(updatedFlag).toMatchObject({ id: flag.id, name: "Management Updated Flag" });

  const listedTokens = await listApiTokensViaApi(
    request,
    workspace.sessionToken,
    workspace.organization.id,
  );
  expect(listedTokens.find((token) => token.id === apiToken.id)).toMatchObject({
    lastUsedAt: expect.any(String),
  });
});

test("restricts project-scoped management tokens to their project", async ({ request }) => {
  const workspace = await createManagementWorkspace(request, {
    configKey: "management-project-config",
    projectSlug: "management-project-token-project",
    userEmail: "management-project-token@capture-flag.test",
  });
  const otherProject = await createProjectViaApi(
    request,
    workspace.sessionToken,
    workspace.organization.id,
    {
      name: "Other Management Project",
      slug: "other-management-project",
    },
  );
  const otherEnvironment = await createEnvironmentViaApi(
    request,
    workspace.sessionToken,
    otherProject.id,
    {
      key: "other-production",
      name: "Other Production",
    },
  );
  const otherConfig = await createConfigViaApi(request, workspace.sessionToken, otherProject.id, {
    key: "other-management-config",
    name: "Other Management Config",
  });
  const otherFlag = await createFeatureFlagViaApi(request, workspace.sessionToken, otherConfig.id, {
    defaultValue: false,
    key: "other-management-flag",
    name: "Other Management Flag",
    type: "boolean",
  });
  const apiToken = await createApiTokenViaApi(
    request,
    workspace.sessionToken,
    workspace.organization.id,
    {
      name: "Project Management Token",
      projectId: workspace.project.id,
      scopes: allManagementScopes,
    },
  );
  const rawToken = apiToken.token ?? "";

  await expect(
    managementGetJson<Project[]>(request, "/api/v1/projects", rawToken),
  ).resolves.toEqual([expect.objectContaining({ id: workspace.project.id })]);
  await expect(
    managementGetJson<Environment[]>(
      request,
      `/api/v1/environments?projectId=${workspace.project.id}`,
      rawToken,
    ),
  ).resolves.toEqual(
    expect.arrayContaining([expect.objectContaining({ id: workspace.environment.id })]),
  );

  const scopedProjectCreateError = await expectJson<ApiError>(
    await request.post(apiUrl("/api/v1/projects"), {
      data: { name: "Forbidden Scoped Project", slug: "forbidden-scoped-project" },
      headers: apiTokenHeaders(rawToken),
    }),
    403,
  );
  expect(scopedProjectCreateError).toMatchObject({
    message: "Project-scoped API token cannot create projects",
    statusCode: 403,
  });

  await expectNotFound(
    request.get(apiUrl(`/api/v1/environments?projectId=${otherProject.id}`), {
      headers: apiTokenHeaders(rawToken),
    }),
    "Project not found",
  );
  await expectNotFound(
    request.get(apiUrl(`/api/v1/flags?configId=${otherConfig.id}`), {
      headers: apiTokenHeaders(rawToken),
    }),
    "Config not found",
  );
  await expectNotFound(
    request.patch(apiUrl(`/api/v1/flags/${otherFlag.id}`), {
      data: { name: "Forbidden Cross Project Rename" },
      headers: apiTokenHeaders(rawToken),
    }),
    "Feature flag not found",
  );
  expect(otherEnvironment.projectId).toBe(otherProject.id);
});

async function createManagementWorkspace(
  request: APIRequestContext,
  input: { configKey: string; projectSlug: string; userEmail: string },
): Promise<ManagementWorkspace> {
  const { organization, project, sessionToken, user } = await createCoreWorkspace(request, {
    organizationName: `${input.projectSlug} org`,
    organizationSlug: `${input.projectSlug}-org`,
    projectName: `${input.projectSlug} project`,
    projectSlug: input.projectSlug,
    userEmail: input.userEmail,
    userName: `${input.projectSlug} user`,
  });
  const environment = await createEnvironmentViaApi(request, sessionToken, project.id, {
    key: "production",
    name: "Production",
  });
  const config = await createConfigViaApi(request, sessionToken, project.id, {
    key: input.configKey,
    name: input.configKey,
  });

  return { config, environment, organization, project, sessionToken, user };
}

async function managementGetJson<TResponse>(
  request: APIRequestContext,
  path: string,
  rawToken: string,
) {
  return expectJson<TResponse>(
    await request.get(apiUrl(path), {
      headers: apiTokenHeaders(rawToken),
    }),
  );
}

async function managementPostJson<TResponse>(
  request: APIRequestContext,
  path: string,
  rawToken: string,
  body: unknown,
) {
  return expectJson<TResponse>(
    await request.post(apiUrl(path), {
      data: body,
      headers: apiTokenHeaders(rawToken),
    }),
    201,
  );
}

async function managementPatchJson<TResponse>(
  request: APIRequestContext,
  path: string,
  rawToken: string,
  body: unknown,
) {
  return expectJson<TResponse>(
    await request.patch(apiUrl(path), {
      data: body,
      headers: apiTokenHeaders(rawToken),
    }),
  );
}

async function expectUnauthorized(responsePromise: Promise<APIResponse>, message: string) {
  const error = await expectJson<ApiError>(await responsePromise, 401);
  expect(error).toMatchObject({ message, statusCode: 401 });
}

async function expectOrganizationRoleDenied(responsePromise: Promise<APIResponse>) {
  const error = await expectJson<ApiError>(await responsePromise, 403);
  expect(error).toMatchObject({
    message: "Organization role is not allowed for this action",
    statusCode: 403,
  });
}

async function expectNotFound(responsePromise: Promise<APIResponse>, message: string) {
  const error = await expectJson<ApiError>(await responsePromise, 404);
  expect(error).toMatchObject({ message, statusCode: 404 });
}
