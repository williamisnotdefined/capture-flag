import { createClient } from "@capture-flag/sdk-js";
import { type APIRequestContext, expect, test } from "@playwright/test";
import { apiGetJson, apiPostJson, apiUrl, authHeaders, expectJson } from "../support/api";
import { disconnectDatabase } from "../support/db";
import {
  type ConfigPreview,
  type PublicConfig,
  createFeatureFlagViaApi,
  getConfigPreviewViaApi,
  updateFeatureFlagValueViaApi,
} from "../support/feature-flags";
import { resetDatabase } from "../support/reset";
import {
  createSegmentViaApi,
  deleteSegmentViaApi,
  listSegmentsViaApi,
  updateSegmentViaApi,
} from "../support/segments";
import {
  type Config,
  type Environment,
  type Project,
  createConfigViaApi,
  createCoreWorkspace,
  createEnvironmentViaApi,
} from "../support/workspace";

type SegmentWorkspace = {
  config: Config;
  environment: Environment;
  project: Project;
  sessionToken: string;
};

type ApiError = {
  error: string;
  message: string;
  statusCode: number;
};

type SdkKey = {
  id: string;
  key: string;
  keyPrefix: string;
};

const betaUserCondition = {
  attribute: "email",
  operator: "endsWith",
  value: "@example.com",
};

test.beforeEach(async () => {
  await resetDatabase();
});

test.afterAll(async () => {
  await disconnectDatabase();
});

test("creates, lists, and publishes segments in config preview", async ({ request }) => {
  const { config, environment, sessionToken } = await createSegmentWorkspace(request, {
    configKey: "segment-create",
    projectSlug: "segment-create-project",
    userEmail: "segment-create@capture-flag.test",
  });
  const initialSegments = await listSegmentsViaApi(request, sessionToken, config.id);
  expect(initialSegments).toEqual([]);
  const previewBeforeCreate = await getConfigPreviewViaApi(
    request,
    sessionToken,
    config.id,
    environment.id,
  );

  const segment = await createSegmentViaApi(request, sessionToken, config.id, {
    conditionsJson: [{ attribute: " email ", operator: "endsWith", value: "@example.com" }],
    description: "Users in example.com email domain",
    key: "beta-users",
    name: "Beta users",
  });
  expect(segment).toMatchObject({
    conditionsJson: [betaUserCondition],
    description: "Users in example.com email domain",
    key: "beta-users",
    name: "Beta users",
  });

  const segments = await listSegmentsViaApi(request, sessionToken, config.id);
  expect(segments.map((item) => item.key)).toEqual(["beta-users"]);
  expect(segments[0]).toMatchObject({ conditionsJson: [betaUserCondition] });

  const previewAfterCreate = await getConfigPreviewViaApi(
    request,
    sessionToken,
    config.id,
    environment.id,
  );
  expect(previewAfterCreate.body.revision).toBeGreaterThan(previewBeforeCreate.body.revision);
  expect(previewAfterCreate.etag).not.toBe(previewBeforeCreate.etag);
  expect(previewAfterCreate.body.segments).toMatchObject({
    "beta-users": {
      conditions: [betaUserCondition],
    },
  });
});

test("updates segment metadata without public bumps and SDK-visible fields with public bumps", async ({
  request,
}) => {
  const { config, environment, sessionToken } = await createSegmentWorkspace(request, {
    configKey: "segment-updates",
    projectSlug: "segment-updates-project",
    userEmail: "segment-updates@capture-flag.test",
  });
  const segment = await createSegmentViaApi(request, sessionToken, config.id, {
    conditionsJson: [betaUserCondition],
    key: "beta-users",
    name: "Beta users",
  });
  const previewAfterCreate = await getConfigPreviewViaApi(
    request,
    sessionToken,
    config.id,
    environment.id,
  );

  const metadataUpdatedSegment = await updateSegmentViaApi(
    request,
    sessionToken,
    config.id,
    segment.id,
    {
      description: "Only UI metadata changed",
      name: "Beta users updated",
    },
  );
  expect(metadataUpdatedSegment).toMatchObject({
    description: "Only UI metadata changed",
    key: "beta-users",
    name: "Beta users updated",
  });
  const previewAfterMetadata = await getConfigPreviewViaApi(
    request,
    sessionToken,
    config.id,
    environment.id,
  );
  expect(previewAfterMetadata.body.revision).toBe(previewAfterCreate.body.revision);
  expect(previewAfterMetadata.etag).toBe(previewAfterCreate.etag);

  await updateSegmentViaApi(request, sessionToken, config.id, segment.id, {
    name: "Beta users updated",
  });
  const previewAfterNoop = await getConfigPreviewViaApi(
    request,
    sessionToken,
    config.id,
    environment.id,
  );
  expect(previewAfterNoop.body.revision).toBe(previewAfterMetadata.body.revision);
  expect(previewAfterNoop.etag).toBe(previewAfterMetadata.etag);

  const enterpriseCondition = {
    attribute: "plan",
    operator: "equals",
    value: "enterprise",
  };
  const conditionsUpdatedSegment = await updateSegmentViaApi(
    request,
    sessionToken,
    config.id,
    segment.id,
    {
      conditionsJson: [{ attribute: " plan ", operator: "equals", value: "enterprise" }],
    },
  );
  expect(conditionsUpdatedSegment).toMatchObject({ conditionsJson: [enterpriseCondition] });
  const previewAfterConditions = await getConfigPreviewViaApi(
    request,
    sessionToken,
    config.id,
    environment.id,
  );
  expect(previewAfterConditions.body.revision).toBeGreaterThan(previewAfterNoop.body.revision);
  expect(previewAfterConditions.etag).not.toBe(previewAfterNoop.etag);
  expect(previewAfterConditions.body.segments).toMatchObject({
    "beta-users": { conditions: [enterpriseCondition] },
  });

  const keyUpdatedSegment = await updateSegmentViaApi(
    request,
    sessionToken,
    config.id,
    segment.id,
    { key: "beta-testers" },
  );
  expect(keyUpdatedSegment).toMatchObject({ key: "beta-testers" });
  const previewAfterKeyUpdate = await getConfigPreviewViaApi(
    request,
    sessionToken,
    config.id,
    environment.id,
  );
  expect(previewAfterKeyUpdate.body.revision).toBeGreaterThan(previewAfterConditions.body.revision);
  expect(previewAfterKeyUpdate.etag).not.toBe(previewAfterConditions.etag);
  expect(previewAfterKeyUpdate.body.segments).not.toHaveProperty("beta-users");
  expect(previewAfterKeyUpdate.body.segments).toMatchObject({
    "beta-testers": { conditions: [enterpriseCondition] },
  });
});

test("evaluates segment references through public config and the SDK", async ({ request }) => {
  const { config, environment, project, sessionToken } = await createSegmentWorkspace(request, {
    configKey: "segment-rules",
    projectSlug: "segment-rules-project",
    userEmail: "segment-rules@capture-flag.test",
  });
  await createSegmentViaApi(request, sessionToken, config.id, {
    conditionsJson: [betaUserCondition],
    key: "beta-users",
    name: "Beta users",
  });
  const flag = await createFeatureFlagViaApi(request, sessionToken, config.id, {
    defaultValue: false,
    key: "new-dashboard",
    name: "New Dashboard",
    type: "boolean",
  });
  await updateFeatureFlagValueViaApi(request, sessionToken, config.id, flag.id, environment.id, {
    defaultValue: false,
    rulesJson: [{ conditions: [{ segment: "beta-users" }], serve: true }],
  });
  const sdkKey = await createSdkKey(request, sessionToken, project.id, config.id, environment.id);
  const publicConfig = await getPublicConfig(request, sdkKey.key);
  expect(publicConfig.segments).toMatchObject({
    "beta-users": { conditions: [betaUserCondition] },
  });
  expect(publicConfig.flags["new-dashboard"].rules).toEqual([
    { conditions: [{ segment: "beta-users" }], serve: true },
  ]);

  const client = createClient({ baseUrl: apiUrl("/"), sdkKey: sdkKey.key });
  try {
    await expect(
      client.getValue("new-dashboard", false, { email: "user@example.com" }),
    ).resolves.toBe(true);
    await expect(
      client.getValue("new-dashboard", false, { email: "user@other.com" }),
    ).resolves.toBe(false);
  } finally {
    client.close();
  }
});

test("blocks segment rename and delete while referenced by active flag rules", async ({
  request,
}) => {
  const { config, environment, sessionToken } = await createSegmentWorkspace(request, {
    configKey: "segment-reference-protection",
    projectSlug: "segment-reference-protection-project",
    userEmail: "segment-reference-protection@capture-flag.test",
  });
  const segment = await createSegmentViaApi(request, sessionToken, config.id, {
    conditionsJson: [betaUserCondition],
    key: "beta-users",
    name: "Beta users",
  });
  const flag = await createFeatureFlagViaApi(request, sessionToken, config.id, {
    defaultValue: false,
    key: "new-dashboard",
    name: "New Dashboard",
    type: "boolean",
  });
  await updateFeatureFlagValueViaApi(request, sessionToken, config.id, flag.id, environment.id, {
    rulesJson: [{ conditions: [{ segment: "beta-users" }], serve: true }],
  });
  const previewBeforeRejectedWrites = await getConfigPreviewViaApi(
    request,
    sessionToken,
    config.id,
    environment.id,
  );

  const renameError = await expectJson<ApiError>(
    await request.patch(apiUrl(`/api/v1/configs/${config.id}/segments/${segment.id}`), {
      data: { key: "beta-testers" },
      headers: authHeaders(sessionToken),
    }),
    400,
  );
  expect(renameError).toMatchObject({
    message: "Cannot rename segment while it is referenced by new-dashboard in production",
    statusCode: 400,
  });

  const deleteError = await expectJson<ApiError>(
    await request.delete(apiUrl(`/api/v1/configs/${config.id}/segments/${segment.id}`), {
      headers: authHeaders(sessionToken),
    }),
    400,
  );
  expect(deleteError).toMatchObject({
    message: "Cannot delete segment while it is referenced by new-dashboard in production",
    statusCode: 400,
  });

  const previewAfterRejectedWrites = await getConfigPreviewViaApi(
    request,
    sessionToken,
    config.id,
    environment.id,
  );
  expect(previewAfterRejectedWrites.body).toEqual(previewBeforeRejectedWrites.body);
  expect(previewAfterRejectedWrites.etag).toBe(previewBeforeRejectedWrites.etag);
});

test("soft deletes unreferenced segments and removes them from public config", async ({
  request,
}) => {
  const { config, environment, project, sessionToken } = await createSegmentWorkspace(request, {
    configKey: "segment-soft-delete",
    projectSlug: "segment-soft-delete-project",
    userEmail: "segment-soft-delete@capture-flag.test",
  });
  const segment = await createSegmentViaApi(request, sessionToken, config.id, {
    conditionsJson: [betaUserCondition],
    key: "delete-me",
    name: "Delete me",
  });
  const sdkKey = await createSdkKey(request, sessionToken, project.id, config.id, environment.id);
  const previewBeforeDelete = await getConfigPreviewViaApi(
    request,
    sessionToken,
    config.id,
    environment.id,
  );
  expect(previewBeforeDelete.body.segments).toHaveProperty("delete-me");

  await expect(deleteSegmentViaApi(request, sessionToken, config.id, segment.id)).resolves.toEqual({
    ok: true,
  });
  const segmentsAfterDelete = await listSegmentsViaApi(request, sessionToken, config.id);
  expect(segmentsAfterDelete.map((item) => item.id)).not.toContain(segment.id);

  const previewAfterDelete = await getConfigPreviewViaApi(
    request,
    sessionToken,
    config.id,
    environment.id,
  );
  expect(previewAfterDelete.body.revision).toBeGreaterThan(previewBeforeDelete.body.revision);
  expect(previewAfterDelete.etag).not.toBe(previewBeforeDelete.etag);
  expect(previewAfterDelete.body.segments).not.toHaveProperty("delete-me");

  const publicConfig = await getPublicConfig(request, sdkKey.key);
  expect(publicConfig).toEqual(previewAfterDelete.body);
  expect(publicConfig.segments).not.toHaveProperty("delete-me");
});

async function createSegmentWorkspace(
  request: APIRequestContext,
  input: { configKey: string; projectSlug: string; userEmail: string },
): Promise<SegmentWorkspace> {
  const { organization, project, sessionToken } = await createCoreWorkspace(request, {
    organizationName: `${input.projectSlug} org`,
    organizationSlug: `${input.projectSlug}-org`,
    projectName: `${input.projectSlug} project`,
    projectSlug: input.projectSlug,
    userEmail: input.userEmail,
    userName: `${input.projectSlug} user`,
  });
  expect(organization.role).toBe("owner");
  const environment = await createEnvironmentViaApi(request, sessionToken, project.id, {
    key: "production",
    name: "Production",
  });
  const config = await createConfigViaApi(request, sessionToken, project.id, {
    key: input.configKey,
    name: input.configKey,
  });

  return { config, environment, project, sessionToken };
}

async function createSdkKey(
  request: APIRequestContext,
  sessionToken: string,
  projectId: string,
  configId: string,
  environmentId: string,
) {
  return apiPostJson<SdkKey>(request, `/api/v1/projects/${projectId}/sdk-keys`, sessionToken, {
    configId,
    environmentId,
    name: "Segment E2E SDK Key",
  });
}

async function getPublicConfig(request: APIRequestContext, sdkKey: string) {
  const response = await request.get(
    apiUrl(`/public-api/v1/sdk/${encodeURIComponent(sdkKey)}/config`),
  );
  expect(response.status()).toBe(200);

  return (await response.json()) as PublicConfig;
}
