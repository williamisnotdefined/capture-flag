import { type APIRequestContext, expect, test } from "@playwright/test";
import { apiUrl, authHeaders, expectJson } from "../support/api";
import { createAuthenticatedUser } from "../support/auth";
import { disconnectDatabase } from "../support/db";
import { createFeatureFlagViaApi } from "../support/feature-flags";
import {
  addOrganizationMemberViaApi,
  addProjectMemberViaApi,
  createUserViaDb,
  listAuditLogsViaApi,
} from "../support/members";
import { resetDatabase } from "../support/reset";
import {
  createSdkKeyViaApi,
  expectPublicSdkKeyNotFound,
  getPublicConfigWithSdkKey,
  listSdkKeysViaApi,
  revokeSdkKeyViaApi,
  rotateSdkKeyViaApi,
} from "../support/sdk-keys";
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

type SdkKeyWorkspace = {
  config: Config;
  environment: Environment;
  organization: Organization;
  project: Project;
  sessionToken: string;
};

type ApiError = {
  error: string;
  message: string;
  statusCode: number;
};

test.beforeEach(async () => {
  await resetDatabase();
});

test.afterAll(async () => {
  await disconnectDatabase();
});

test("lists and creates SDK keys without re-exposing raw keys", async ({ request }) => {
  const { config, environment, project, sessionToken } = await createSdkKeyWorkspace(request, {
    configKey: "sdk-key-create",
    projectSlug: "sdk-key-create-project",
    userEmail: "sdk-key-create@capture-flag.test",
  });

  await expect(listSdkKeysViaApi(request, sessionToken, project.id)).resolves.toEqual([]);

  const sdkKey = await createSdkKeyViaApi(request, sessionToken, project.id, {
    configId: config.id,
    environmentId: environment.id,
    name: "Browser SDK Key",
  });
  expect(sdkKey).toMatchObject({
    configId: config.id,
    environmentId: environment.id,
    lastUsedAt: null,
    name: "Browser SDK Key",
    projectId: project.id,
    revokedAt: null,
  });
  expect(sdkKey.key).toMatch(/^cf_sdk_/);
  expect(sdkKey.keyPrefix).toBe(sdkKey.key?.slice(0, 18));

  const sdkKeys = await listSdkKeysViaApi(request, sessionToken, project.id);
  expect(sdkKeys).toHaveLength(1);
  expect(sdkKeys[0]).toMatchObject({
    config: { id: config.id, key: config.key },
    environment: { id: environment.id, key: environment.key },
    id: sdkKey.id,
    keyPrefix: sdkKey.keyPrefix,
    revokedAt: null,
  });
  expect("key" in sdkKeys[0]).toBe(false);
});

test("serves public config with SDK keys and records last usage", async ({ request }) => {
  const { config, environment, project, sessionToken } = await createSdkKeyWorkspace(request, {
    configKey: "sdk-key-public-config",
    projectSlug: "sdk-key-public-config-project",
    userEmail: "sdk-key-public-config@capture-flag.test",
  });
  await createFeatureFlagViaApi(request, sessionToken, config.id, {
    defaultValue: true,
    key: "sdk-backed-flag",
    name: "SDK Backed Flag",
    type: "boolean",
  });
  const sdkKey = await createSdkKeyViaApi(request, sessionToken, project.id, {
    configId: config.id,
    environmentId: environment.id,
    name: "Public Config SDK Key",
  });

  const publicConfig = await getPublicConfigWithSdkKey(request, sdkKey.key ?? "");
  expect(publicConfig.cacheControl).toBe("private, no-cache");
  expect(publicConfig.etag).toEqual(expect.any(String));
  expect(publicConfig.body).toMatchObject({
    configKey: config.key,
    environment: environment.key,
    flags: {
      "sdk-backed-flag": { defaultValue: true, type: "boolean" },
    },
    projectKey: project.slug,
    schemaVersion: 1,
  });

  const sdkKeysAfterUse = await listSdkKeysViaApi(request, sessionToken, project.id);
  expect(sdkKeysAfterUse[0]).toMatchObject({ id: sdkKey.id, lastUsedAt: expect.any(String) });

  const notModifiedResponse = await request.get(
    apiUrl(`/public-api/v1/sdk/${encodeURIComponent(sdkKey.key ?? "")}/config`),
    { headers: { "If-None-Match": publicConfig.etag } },
  );
  expect(notModifiedResponse.status()).toBe(304);
  await expect(notModifiedResponse.text()).resolves.toBe("");
});

test("revokes SDK keys and prevents revoked public config access", async ({ request }) => {
  const { config, environment, project, sessionToken } = await createSdkKeyWorkspace(request, {
    configKey: "sdk-key-revoke",
    projectSlug: "sdk-key-revoke-project",
    userEmail: "sdk-key-revoke@capture-flag.test",
  });
  const sdkKey = await createSdkKeyViaApi(request, sessionToken, project.id, {
    configId: config.id,
    environmentId: environment.id,
    name: "Revocable SDK Key",
  });
  await getPublicConfigWithSdkKey(request, sdkKey.key ?? "");

  const revokedSdkKey = await revokeSdkKeyViaApi(request, sessionToken, sdkKey.id);
  expect(revokedSdkKey).toMatchObject({ id: sdkKey.id, keyPrefix: sdkKey.keyPrefix });
  expect(revokedSdkKey.revokedAt).toEqual(expect.any(String));
  expect("key" in revokedSdkKey).toBe(false);

  await expectPublicSdkKeyNotFound(request, sdkKey.key ?? "");

  const secondRevokeError = await expectJson<ApiError>(
    await request.post(apiUrl(`/api/v1/sdk-keys/${sdkKey.id}/revoke`), {
      data: {},
      headers: authHeaders(sessionToken),
    }),
    400,
  );
  expect(secondRevokeError).toMatchObject({
    message: "SDK key is already revoked",
    statusCode: 400,
  });
});

test("rotates SDK keys by revoking the old key and creating a new raw key", async ({ request }) => {
  const { config, environment, project, sessionToken } = await createSdkKeyWorkspace(request, {
    configKey: "sdk-key-rotate",
    projectSlug: "sdk-key-rotate-project",
    userEmail: "sdk-key-rotate@capture-flag.test",
  });
  const sdkKey = await createSdkKeyViaApi(request, sessionToken, project.id, {
    configId: config.id,
    environmentId: environment.id,
    name: "Rotatable SDK Key",
  });

  const rotatedSdkKey = await rotateSdkKeyViaApi(request, sessionToken, sdkKey.id);
  expect(rotatedSdkKey).toMatchObject({
    configId: config.id,
    environmentId: environment.id,
    name: "Rotatable SDK Key",
    projectId: project.id,
    revokedAt: null,
  });
  expect(rotatedSdkKey.id).not.toBe(sdkKey.id);
  expect(rotatedSdkKey.key).toMatch(/^cf_sdk_/);
  expect(rotatedSdkKey.keyPrefix).not.toBe(sdkKey.keyPrefix);

  await expectPublicSdkKeyNotFound(request, sdkKey.key ?? "");
  await getPublicConfigWithSdkKey(request, rotatedSdkKey.key ?? "");

  const sdkKeys = await listSdkKeysViaApi(request, sessionToken, project.id);
  const oldListedKey = sdkKeys.find((item) => item.id === sdkKey.id);
  const newListedKey = sdkKeys.find((item) => item.id === rotatedSdkKey.id);
  expect(oldListedKey?.revokedAt).toEqual(expect.any(String));
  expect(newListedKey).toMatchObject({ id: rotatedSdkKey.id, revokedAt: null });
  expect("key" in (newListedKey ?? {})).toBe(false);
});

test("rejects SDK key creation with mismatched project resources", async ({ request }) => {
  const { config, environment, organization, project, sessionToken } = await createSdkKeyWorkspace(
    request,
    {
      configKey: "sdk-key-mismatch",
      projectSlug: "sdk-key-mismatch-project",
      userEmail: "sdk-key-mismatch@capture-flag.test",
    },
  );
  const otherProject = await createProjectViaApi(request, sessionToken, organization.id, {
    name: "Other Project",
    slug: "other-sdk-key-project",
  });
  const otherEnvironment = await createEnvironmentViaApi(request, sessionToken, otherProject.id, {
    key: "other-production",
    name: "Other Production",
  });
  const otherConfig = await createConfigViaApi(request, sessionToken, otherProject.id, {
    key: "other-config",
    name: "Other Config",
  });

  const configMismatchError = await expectJson<ApiError>(
    await request.post(apiUrl(`/api/v1/projects/${project.id}/sdk-keys`), {
      data: { configId: otherConfig.id, environmentId: environment.id },
      headers: authHeaders(sessionToken),
    }),
    400,
  );
  expect(configMismatchError).toMatchObject({
    message: "Config does not belong to the project",
    statusCode: 400,
  });

  const environmentMismatchError = await expectJson<ApiError>(
    await request.post(apiUrl(`/api/v1/projects/${project.id}/sdk-keys`), {
      data: { configId: config.id, environmentId: otherEnvironment.id },
      headers: authHeaders(sessionToken),
    }),
    400,
  );
  expect(environmentMismatchError).toMatchObject({
    message: "Environment does not belong to the project",
    statusCode: 400,
  });
});

test("requires project admin permissions for SDK key writes", async ({ request }) => {
  const { config, environment, organization, project, sessionToken } = await createSdkKeyWorkspace(
    request,
    {
      configKey: "sdk-key-role-gate",
      projectSlug: "sdk-key-role-gate-project",
      userEmail: "sdk-key-role-gate@capture-flag.test",
    },
  );
  const developerAuth = await createAuthenticatedUser({
    email: "sdk-key-developer@capture-flag.test",
    name: "SDK Key Developer",
  });
  await addOrganizationMemberViaApi(request, sessionToken, organization.id, {
    role: "member",
    userId: developerAuth.user.id,
  });
  await addProjectMemberViaApi(request, sessionToken, project.id, {
    role: "developer",
    userId: developerAuth.user.id,
  });

  const developerCreateError = await expectJson<ApiError>(
    await request.post(apiUrl(`/api/v1/projects/${project.id}/sdk-keys`), {
      data: { configId: config.id, environmentId: environment.id },
      headers: authHeaders(developerAuth.sessionToken),
    }),
    403,
  );
  expect(developerCreateError).toMatchObject({
    message: "Project role is not allowed for this action",
    statusCode: 403,
  });
});

test("records SDK key audit logs without leaking raw credentials", async ({ request }) => {
  const { config, environment, organization, project, sessionToken } = await createSdkKeyWorkspace(
    request,
    {
      configKey: "sdk-key-audit",
      projectSlug: "sdk-key-audit-project",
      userEmail: "sdk-key-audit@capture-flag.test",
    },
  );
  const sdkKey = await createSdkKeyViaApi(request, sessionToken, project.id, {
    configId: config.id,
    environmentId: environment.id,
    name: "Audited SDK Key",
  });
  const rotatedSdkKey = await rotateSdkKeyViaApi(request, sessionToken, sdkKey.id);
  await revokeSdkKeyViaApi(request, sessionToken, rotatedSdkKey.id);

  const auditLogs = await listAuditLogsViaApi(request, sessionToken, organization.id, {
    entityType: "sdk_key",
    projectId: project.id,
  });
  expect(auditLogs.items.map((log) => log.action)).toEqual(
    expect.arrayContaining(["sdk_key.created", "sdk_key.revoked", "sdk_key.rotated"]),
  );
  const serializedLogs = JSON.stringify(auditLogs.items);
  expect(serializedLogs).toContain(sdkKey.keyPrefix);
  expect(serializedLogs).toContain(rotatedSdkKey.keyPrefix);
  expect(serializedLogs).not.toContain(sdkKey.key ?? "missing-old-raw-key");
  expect(serializedLogs).not.toContain(rotatedSdkKey.key ?? "missing-new-raw-key");
});

async function createSdkKeyWorkspace(
  request: APIRequestContext,
  input: { configKey: string; projectSlug: string; userEmail: string },
): Promise<SdkKeyWorkspace> {
  const { organization, project, sessionToken } = await createCoreWorkspace(request, {
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

  return { config, environment, organization, project, sessionToken };
}
