import { createClient } from "@capture-flag/sdk-js";
import { expect, test } from "@playwright/test";
import { apiUrl, authHeaders, expectJson } from "../support/api";
import { apiTokenHeaders } from "../support/api-tokens";
import { disconnectDatabase } from "../support/db";
import {
  createFeatureFlagViaApi,
  getConfigPreviewViaApi,
  listFeatureFlagsViaApi,
  updateFeatureFlagValueViaApi,
} from "../support/feature-flags";
import {
  createFlagWorkspace,
  createRbacWorkspace,
  createTargetingWorkspace,
  createTokenWorkspace,
} from "../support/fixtures";
import { listAuditLogsViaApi } from "../support/members";
import { resetDatabase } from "../support/reset";
import { createSdkKeyViaApi, getPublicConfigWithSdkKey } from "../support/sdk-keys";
import { type Project, createConfigViaApi } from "../support/workspace";

type ApiError = {
  error: string;
  message: string;
  statusCode: number;
};

const supportedTypes = ["boolean", "double", "integer", "json_array", "json_object", "string"];

test.beforeEach(async () => {
  await resetDatabase();
});

test.afterAll(async () => {
  await disconnectDatabase();
});

test("lists populated flags and keeps config scopes isolated", async ({ request }) => {
  const workspace = await createFlagWorkspace(request);

  const primaryFlags = await listFeatureFlagsViaApi(
    request,
    workspace.sessionToken,
    workspace.config.id,
  );
  const secondaryFlags = await listFeatureFlagsViaApi(
    request,
    workspace.sessionToken,
    workspace.secondaryConfig.id,
  );

  expect(primaryFlags).toHaveLength(workspace.primaryFlags.length);
  expect(secondaryFlags).toHaveLength(workspace.secondaryFlags.length);
  expect([...new Set(primaryFlags.map((flag) => flag.type))].sort()).toEqual(supportedTypes);
  expect(primaryFlags.filter((flag) => flag.tags.includes("bulk"))).toHaveLength(18);
  expect(primaryFlags.filter((flag) => flag.tags.includes("even"))).toHaveLength(9);
  expect(primaryFlags.map((flag) => flag.key)).not.toContain(workspace.archivedFlag.key);
  expect(secondaryFlags.every((flag) => flag.tags.includes("secondary"))).toBe(true);

  const primaryPreview = await getConfigPreviewViaApi(
    request,
    workspace.sessionToken,
    workspace.config.id,
    workspace.environments.production.id,
  );
  expect(Object.keys(primaryPreview.body.flags)).toHaveLength(workspace.primaryFlags.length);
  expect(primaryPreview.body.flags).toHaveProperty("booleanFlag");
  expect(primaryPreview.body.flags).not.toHaveProperty("secondaryFlag0");
  expect(primaryPreview.body.flags).not.toHaveProperty(workspace.archivedFlag.key);
});

test("keeps environment values and public config delivery isolated", async ({ request }) => {
  const workspace = await createFlagWorkspace(request);
  const bulkFlag = workspace.primaryFlags.find((flag) => flag.key === "bulkFlag00");
  if (!bulkFlag) {
    throw new Error("Expected populated bulkFlag00 fixture");
  }

  await updateFeatureFlagValueViaApi(
    request,
    workspace.sessionToken,
    workspace.config.id,
    bulkFlag.id,
    workspace.environments.production.id,
    { defaultValue: true },
  );
  await updateFeatureFlagValueViaApi(
    request,
    workspace.sessionToken,
    workspace.config.id,
    bulkFlag.id,
    workspace.environments.staging.id,
    { defaultValue: false },
  );

  const productionPreview = await getConfigPreviewViaApi(
    request,
    workspace.sessionToken,
    workspace.config.id,
    workspace.environments.production.id,
  );
  const stagingPreview = await getConfigPreviewViaApi(
    request,
    workspace.sessionToken,
    workspace.config.id,
    workspace.environments.staging.id,
  );
  expect(productionPreview.body.flags.bulkFlag00.defaultValue).toBe(true);
  expect(stagingPreview.body.flags.bulkFlag00.defaultValue).toBe(false);

  const sdkKey = await createSdkKeyViaApi(request, workspace.sessionToken, workspace.project.id, {
    configId: workspace.config.id,
    environmentId: workspace.environments.production.id,
    name: "Populated Public Config Key",
  });
  const publicConfig = await getPublicConfigWithSdkKey(request, sdkKey.key ?? "");
  expect(publicConfig.body.configKey).toBe(workspace.config.key);
  expect(publicConfig.body.environment).toBe(workspace.environments.production.key);
  expect(publicConfig.body.flags.bulkFlag00.defaultValue).toBe(true);
  expect(publicConfig.body.flags).not.toHaveProperty("secondaryFlag0");
  expect(publicConfig.body.flags).not.toHaveProperty(workspace.archivedFlag.key);
});

test("publishes populated targeting data and evaluates it locally in the SDK", async ({
  request,
}) => {
  const workspace = await createTargetingWorkspace(request);
  const sdkKey = await createSdkKeyViaApi(request, workspace.sessionToken, workspace.project.id, {
    configId: workspace.config.id,
    environmentId: workspace.environments.production.id,
    name: "Populated Targeting SDK Key",
  });
  const publicConfig = await getPublicConfigWithSdkKey(request, sdkKey.key ?? "");

  expect(publicConfig.body.segments).toMatchObject({
    "beta-users": {
      conditions: [{ attribute: "email", operator: "endsWith", value: "@beta.test" }],
    },
  });
  expect(publicConfig.body.flags.targetingDecision.rules).toEqual([
    { conditions: [{ segment: "beta-users" }], serve: true },
    {
      conditions: [
        { prerequisiteFlag: "accountEnabled", operator: "equals", value: true },
        { attribute: "plan", operator: "oneOf", value: ["pro", "enterprise"] },
      ],
      serve: true,
    },
  ]);
  expect(publicConfig.body.flags.rolloutDecision.percentageOptions).toEqual([
    { percentage: 100, value: true },
  ]);

  const client = createClient({ baseUrl: apiUrl("/"), sdkKey: sdkKey.key ?? "" });
  try {
    await expect(
      client.getValue("targetingDecision", false, { email: "ada@beta.test" }),
    ).resolves.toBe(true);
    await expect(
      client.getValue("targetingDecision", false, {
        custom: { plan: "enterprise" },
        email: "ada@stable.test",
      }),
    ).resolves.toBe(true);
    await expect(
      client.getValue("targetingDecision", false, {
        custom: { plan: "free" },
        email: "ada@stable.test",
      }),
    ).resolves.toBe(false);
    await expect(
      client.getValue("rolloutDecision", false, { identifier: "populated-user" }),
    ).resolves.toBe(true);
  } finally {
    client.close();
  }
});

test("filters audit logs and keeps token secrets out of populated audit data", async ({
  request,
}) => {
  const workspace = await createTokenWorkspace(request);

  const firstAuditPage = await listAuditLogsViaApi(
    request,
    workspace.sessionToken,
    workspace.organization.id,
    {
      entityType: "feature_flag",
      limit: 3,
      projectId: workspace.project.id,
    },
  );
  expect(firstAuditPage.items).toHaveLength(3);
  expect(firstAuditPage.nextCursor).toEqual(expect.any(String));

  const secondAuditPage = await listAuditLogsViaApi(
    request,
    workspace.sessionToken,
    workspace.organization.id,
    {
      cursor: firstAuditPage.nextCursor ?? undefined,
      entityType: "feature_flag",
      limit: 3,
      projectId: workspace.project.id,
    },
  );
  expect(secondAuditPage.items).toHaveLength(3);
  expect(secondAuditPage.items.map((item) => item.id)).not.toEqual(
    expect.arrayContaining(firstAuditPage.items.map((item) => item.id)),
  );

  const tokenAuditLogs = await listAuditLogsViaApi(
    request,
    workspace.sessionToken,
    workspace.organization.id,
    {
      entityType: "api_token",
    },
  );
  const sdkKeyAuditLogs = await listAuditLogsViaApi(
    request,
    workspace.sessionToken,
    workspace.organization.id,
    {
      entityType: "sdk_key",
      projectId: workspace.project.id,
    },
  );
  const serializedAuditLogs = JSON.stringify([...tokenAuditLogs.items, ...sdkKeyAuditLogs.items]);
  expect(serializedAuditLogs).not.toContain(workspace.apiTokens.organization.rawToken);
  expect(serializedAuditLogs).not.toContain(workspace.apiTokens.project.rawToken);
  expect(serializedAuditLogs).not.toContain(workspace.apiTokens.revoked.rawToken);
  expect(serializedAuditLogs).not.toContain(workspace.apiTokens.expired.rawToken);
  expect(serializedAuditLogs).not.toContain(workspace.sdkKeys.active.rawKey);
  expect(serializedAuditLogs).not.toContain(workspace.sdkKeys.revoked.rawKey);

  const scopedProjects = await expectJson<Project[]>(
    await request.get(apiUrl("/api/v1/projects"), {
      headers: apiTokenHeaders(workspace.apiTokens.project.rawToken),
    }),
  );
  expect(scopedProjects.map((project) => project.id)).toEqual([workspace.project.id]);
  expect(scopedProjects.map((project) => project.id)).not.toContain(workspace.otherProject.id);
});

test("preserves RBAC behavior in populated workspaces", async ({ request }) => {
  const workspace = await createRbacWorkspace(request);

  await expect(
    listFeatureFlagsViaApi(request, workspace.members.viewer.sessionToken, workspace.config.id),
  ).resolves.toHaveLength(workspace.primaryFlags.length);

  const organizationViewerError = await expectJson<ApiError>(
    await request.get(apiUrl(`/api/v1/configs/${workspace.config.id}/feature-flags`), {
      headers: authHeaders(workspace.members.organizationViewer.sessionToken),
    }),
    403,
  );
  expect(organizationViewerError).toMatchObject({
    message: "Project access denied",
    statusCode: 403,
  });

  const viewerCreateError = await expectJson<ApiError>(
    await request.post(apiUrl(`/api/v1/configs/${workspace.config.id}/feature-flags`), {
      data: {
        defaultValue: false,
        key: "viewerPopulatedFlag",
        name: "Viewer Populated Flag",
        type: "boolean",
      },
      headers: authHeaders(workspace.members.viewer.sessionToken),
    }),
    403,
  );
  expect(viewerCreateError).toMatchObject({
    message: "Project role is not allowed for this action",
    statusCode: 403,
  });

  await expect(
    createFeatureFlagViaApi(
      request,
      workspace.members.developer.sessionToken,
      workspace.config.id,
      {
        defaultValue: true,
        key: "developerPopulatedFlag",
        name: "Developer Populated Flag",
        tags: ["developer"],
        type: "boolean",
      },
    ),
  ).resolves.toMatchObject({ key: "developerPopulatedFlag" });

  await expect(
    createConfigViaApi(request, workspace.members.projectAdmin.sessionToken, workspace.project.id, {
      key: "project-admin-config",
      name: "Project Admin Config",
    }),
  ).resolves.toMatchObject({ key: "project-admin-config", projectId: workspace.project.id });
});
