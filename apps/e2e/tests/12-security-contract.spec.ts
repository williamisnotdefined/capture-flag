import { expect, test } from "@playwright/test";
import { apiUrl } from "../support/api";
import { apiTokenHeaders, createApiTokenViaApi, revokeApiTokenViaApi } from "../support/api-tokens";
import { createAuthenticatedUser } from "../support/auth";
import { disconnectDatabase, prisma } from "../support/db";
import { clientBaseUrl } from "../support/env";
import { resetDatabase } from "../support/reset";
import { createSdkKeyViaApi, revokeSdkKeyViaApi } from "../support/sdk-keys";
import { type Project, createCoreWorkspace, createEnvironmentViaApi } from "../support/workspace";

type OpenApiDocument = {
  paths: Record<
    string,
    Record<
      string,
      {
        description?: string;
        security?: Array<Record<string, string[]>>;
      }
    >
  >;
};

test.beforeEach(async () => {
  await resetDatabase();
});

test.afterAll(async () => {
  await disconnectDatabase();
});

test("serves baseline security headers and configured CORS origin", async ({ request }) => {
  const response = await request.get(apiUrl("/health"), {
    headers: {
      Origin: clientBaseUrl,
    },
  });

  expect(response.status()).toBe(200);
  expect(response.headers()["access-control-allow-credentials"]).toBe("true");
  expect(response.headers()["access-control-allow-origin"]).toBe(clientBaseUrl);
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBeDefined();
});

test("restricts OpenAPI JSON to the public Management API surface", async ({ request }) => {
  const response = await request.get(apiUrl("/api/v1/openapi.json"));
  expect(response.status()).toBe(200);

  const document = (await response.json()) as OpenApiDocument;
  expect(Object.keys(document.paths).sort()).toEqual([
    "/api/v1/configs/{configId}/segments",
    "/api/v1/configs/{configId}/segments/{segmentId}",
    "/api/v1/environments",
    "/api/v1/flags",
    "/api/v1/flags/{id}",
    "/api/v1/organizations/{organizationId}/members",
    "/api/v1/organizations/{organizationId}/members/{memberId}",
    "/api/v1/projects",
    "/api/v1/projects/{projectId}/configs",
    "/api/v1/projects/{projectId}/members",
  ]);
  expect(document.paths["/api/v1/projects"].get.security).toEqual([{ "api-token": [] }]);
  expect(document.paths["/api/v1/flags"].post.description).toContain("flags:write");
  expect(document.paths).not.toHaveProperty("/api/v1/auth/me");
  expect(document.paths).not.toHaveProperty("/api/v1/organizations");
  expect(document.paths).not.toHaveProperty("/public-api/v1/sdk/{sdkKey}/config");
});

test("persists sessions, SDK keys, and API tokens as hashes instead of raw credentials", async ({
  request,
}) => {
  const auth = await createAuthenticatedUser({
    email: "security-session@capture-flag.test",
    name: "Security Session User",
  });
  const workspace = await createCoreWorkspace(request, {
    organizationName: "Security Hash Org",
    organizationSlug: "security-hash-org",
    projectName: "Security Hash Project",
    projectSlug: "security-hash-project",
    userEmail: "security-hash-owner@capture-flag.test",
    userName: "Security Hash Owner",
  });
  const environment = await createEnvironmentViaApi(
    request,
    workspace.sessionToken,
    workspace.project.id,
    {
      key: "production",
      name: "Production",
    },
  );
  const sdkKey = await createSdkKeyViaApi(request, workspace.sessionToken, workspace.project.id, {
    configId: workspace.defaultConfig.id,
    environmentId: environment.id,
    name: "Security Hash SDK Key",
  });
  const apiToken = await createApiTokenViaApi(
    request,
    workspace.sessionToken,
    workspace.organization.id,
    {
      name: "Security Hash API Token",
      scopes: ["projects:read"],
    },
  );

  const storedSession = await prisma.session.findUniqueOrThrow({
    select: { tokenHash: true },
    where: { id: auth.session.id },
  });
  const storedSdkKey = await prisma.sdkKey.findUniqueOrThrow({
    select: { keyHash: true, keyPrefix: true },
    where: { id: sdkKey.id },
  });
  const storedApiToken = await prisma.apiToken.findUniqueOrThrow({
    select: { tokenHash: true, tokenPrefix: true },
    where: { id: apiToken.id },
  });

  expect(storedSession.tokenHash).not.toBe(auth.sessionToken);
  expect(storedSession.tokenHash).toHaveLength(64);
  expect(storedSdkKey.keyHash).not.toBe(sdkKey.key);
  expect(storedSdkKey.keyHash).toHaveLength(64);
  expect(storedSdkKey.keyPrefix).toBe(sdkKey.key?.slice(0, 18));
  expect(storedApiToken.tokenHash).not.toBe(apiToken.token);
  expect(storedApiToken.tokenHash).toHaveLength(64);
  expect(storedApiToken.tokenPrefix).toBe(apiToken.token?.slice(0, 18));

  const serializedStoredCredentials = JSON.stringify({
    storedApiToken,
    storedSdkKey,
    storedSession,
  });
  expect(serializedStoredCredentials).not.toContain(auth.sessionToken);
  expect(serializedStoredCredentials).not.toContain(sdkKey.key ?? "missing-sdk-key");
  expect(serializedStoredCredentials).not.toContain(apiToken.token ?? "missing-api-token");
});

test("continues to reject revoked SDK keys and API tokens", async ({ request }) => {
  const workspace = await createCoreWorkspace(request, {
    organizationName: "Security Revoke Org",
    organizationSlug: "security-revoke-org",
    projectName: "Security Revoke Project",
    projectSlug: "security-revoke-project",
    userEmail: "security-revoke-owner@capture-flag.test",
    userName: "Security Revoke Owner",
  });
  const environment = await createEnvironmentViaApi(
    request,
    workspace.sessionToken,
    workspace.project.id,
    {
      key: "production",
      name: "Production",
    },
  );
  const sdkKey = await createSdkKeyViaApi(request, workspace.sessionToken, workspace.project.id, {
    configId: workspace.defaultConfig.id,
    environmentId: environment.id,
    name: "Security Revoked SDK Key",
  });
  const apiToken = await createApiTokenViaApi(
    request,
    workspace.sessionToken,
    workspace.organization.id,
    {
      name: "Security Revoked API Token",
      scopes: ["projects:read"],
    },
  );

  await revokeSdkKeyViaApi(request, workspace.sessionToken, sdkKey.id);
  await revokeApiTokenViaApi(request, workspace.sessionToken, apiToken.id);

  const revokedSdkResponse = await request.get(
    apiUrl(`/public-api/v1/sdk/${encodeURIComponent(sdkKey.key ?? "")}/config`),
  );
  expect(revokedSdkResponse.status()).toBe(404);

  const revokedApiTokenResponse = await request.get(apiUrl("/api/v1/projects"), {
    headers: apiTokenHeaders(apiToken.token ?? ""),
  });
  expect(revokedApiTokenResponse.status()).toBe(401);

  const activeProjectList = await request.get(apiUrl("/api/v1/projects"), {
    headers: apiTokenHeaders(
      (
        await createApiTokenViaApi(request, workspace.sessionToken, workspace.organization.id, {
          name: "Security Active API Token",
          scopes: ["projects:read"],
        })
      ).token ?? "",
    ),
  });
  expect(activeProjectList.status()).toBe(200);
  const projects = (await activeProjectList.json()) as Project[];
  expect(projects.map((project) => project.id)).toContain(workspace.project.id);
});
