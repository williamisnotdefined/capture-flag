import { createClient } from "@capture-flag/sdk-js";
import { type APIRequestContext, expect, test } from "@playwright/test";
import { apiUrl, authHeaders, expectJson } from "../support/api";
import { disconnectDatabase } from "../support/db";
import {
  createFeatureFlagViaApi,
  deleteFeatureFlagViaApi,
  getConfigPreviewViaApi,
  updateFeatureFlagValueViaApi,
  updateFeatureFlagViaApi,
} from "../support/feature-flags";
import { resetDatabase } from "../support/reset";
import { createSdkKeyViaApi, getPublicConfigWithSdkKey } from "../support/sdk-keys";
import {
  type Config,
  type Environment,
  type Project,
  createConfigViaApi,
  createCoreWorkspace,
  createEnvironmentViaApi,
} from "../support/workspace";

type TargetingWorkspace = {
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

test.beforeEach(async () => {
  await resetDatabase();
});

test.afterAll(async () => {
  await disconnectDatabase();
});

test("returns not found for invalid SDK keys", async ({ request }) => {
  const response = await request.get(apiUrl("/public-api/v1/sdk/cf_sdk_invalid/config"));

  expect(response.status()).toBe(404);
  const body = (await response.json()) as ApiError;
  expect(body).toMatchObject({ message: "SDK key not found", statusCode: 404 });
});

test("keeps authenticated preview and public config consistent", async ({ request }) => {
  const { config, environment, project, sessionToken } = await createTargetingWorkspace(request, {
    configKey: "targeting-consistency",
    projectSlug: "targeting-consistency-project",
    userEmail: "targeting-consistency@capture-flag.test",
  });
  await createFeatureFlagViaApi(request, sessionToken, config.id, {
    defaultValue: "control",
    key: "targeting-copy",
    name: "Targeting Copy",
    type: "string",
  });
  const sdkKey = await createSdkKeyViaApi(request, sessionToken, project.id, {
    configId: config.id,
    environmentId: environment.id,
    name: "Targeting Consistency SDK Key",
  });

  const preview = await getConfigPreviewViaApi(request, sessionToken, config.id, environment.id);
  const publicConfig = await getPublicConfigWithSdkKey(request, sdkKey.key ?? "");

  expect(publicConfig.etag).toBe(preview.etag);
  expect(publicConfig.body).toEqual(preview.body);
});

test("emits and evaluates percentage rollout options", async ({ request }) => {
  const { config, environment, project, sessionToken } = await createTargetingWorkspace(request, {
    configKey: "targeting-rollout",
    projectSlug: "targeting-rollout-project",
    userEmail: "targeting-rollout@capture-flag.test",
  });
  const flag = await createFeatureFlagViaApi(request, sessionToken, config.id, {
    defaultValue: false,
    key: "rollout-flag",
    name: "Rollout Flag",
    type: "boolean",
  });
  const previewBeforeRollout = await getConfigPreviewViaApi(
    request,
    sessionToken,
    config.id,
    environment.id,
  );

  await updateFeatureFlagValueViaApi(request, sessionToken, config.id, flag.id, environment.id, {
    percentageOptionsJson: [{ percentage: 100, value: true }],
  });
  const previewAfterRollout = await getConfigPreviewViaApi(
    request,
    sessionToken,
    config.id,
    environment.id,
  );
  expect(previewAfterRollout.body.revision).toBeGreaterThan(previewBeforeRollout.body.revision);
  expect(previewAfterRollout.etag).not.toBe(previewBeforeRollout.etag);
  expect(previewAfterRollout.body.flags["rollout-flag"]).toMatchObject({
    defaultValue: false,
    percentageAttribute: "identifier",
    percentageOptions: [{ percentage: 100, value: true }],
    rules: [],
  });

  const sdkKey = await createSdkKeyViaApi(request, sessionToken, project.id, {
    configId: config.id,
    environmentId: environment.id,
    name: "Rollout SDK Key",
  });
  const client = createClient({ baseUrl: apiUrl("/"), sdkKey: sdkKey.key ?? "" });
  try {
    await expect(client.getValue("rollout-flag", false, { identifier: "user-1" })).resolves.toBe(
      true,
    );
    await expect(client.getValue("rollout-flag", false)).resolves.toBe(false);
  } finally {
    client.close();
  }
});

test("evaluates advanced targeting operators locally in the SDK", async ({ request }) => {
  const { config, environment, project, sessionToken } = await createTargetingWorkspace(request, {
    configKey: "advanced-targeting",
    projectSlug: "advanced-targeting-project",
    userEmail: "advanced-targeting@capture-flag.test",
  });
  const arrayFlag = await createFeatureFlagViaApi(request, sessionToken, config.id, {
    defaultValue: false,
    key: "array-contains-flag",
    name: "Array Contains Flag",
    type: "boolean",
  });
  const dateFlag = await createFeatureFlagViaApi(request, sessionToken, config.id, {
    defaultValue: false,
    key: "date-after-flag",
    name: "Date After Flag",
    type: "boolean",
  });
  const semverFlag = await createFeatureFlagViaApi(request, sessionToken, config.id, {
    defaultValue: false,
    key: "semver-flag",
    name: "SemVer Flag",
    type: "boolean",
  });

  await updateFeatureFlagValueViaApi(
    request,
    sessionToken,
    config.id,
    arrayFlag.id,
    environment.id,
    {
      rulesJson: [
        {
          conditions: [{ attribute: "roles", operator: "arrayContains", value: "beta" }],
          serve: true,
        },
      ],
    },
  );
  await updateFeatureFlagValueViaApi(
    request,
    sessionToken,
    config.id,
    dateFlag.id,
    environment.id,
    {
      rulesJson: [
        {
          conditions: [{ attribute: "launchDate", operator: "dateAfter", value: "2026-01-01" }],
          serve: true,
        },
      ],
    },
  );
  await updateFeatureFlagValueViaApi(
    request,
    sessionToken,
    config.id,
    semverFlag.id,
    environment.id,
    {
      rulesJson: [
        {
          conditions: [{ attribute: "appVersion", operator: "semverGreaterThan", value: "2.0.0" }],
          serve: true,
        },
      ],
    },
  );

  const sdkKey = await createSdkKeyViaApi(request, sessionToken, project.id, {
    configId: config.id,
    environmentId: environment.id,
    name: "Advanced Targeting SDK Key",
  });
  const publicConfig = await getPublicConfigWithSdkKey(request, sdkKey.key ?? "");
  expect(publicConfig.body.flags["array-contains-flag"].rules).toEqual([
    {
      conditions: [{ attribute: "roles", operator: "arrayContains", value: "beta" }],
      serve: true,
    },
  ]);

  const client = createClient({ baseUrl: apiUrl("/"), sdkKey: sdkKey.key ?? "" });
  try {
    await expect(
      client.getValue("array-contains-flag", false, { custom: { roles: ["beta"] } }),
    ).resolves.toBe(true);
    await expect(
      client.getValue("array-contains-flag", false, { custom: { roles: ["stable"] } }),
    ).resolves.toBe(false);
    await expect(
      client.getValue("date-after-flag", false, { custom: { launchDate: "2026-02-01" } }),
    ).resolves.toBe(true);
    await expect(
      client.getValue("date-after-flag", false, { custom: { launchDate: "2025-12-31" } }),
    ).resolves.toBe(false);
    await expect(
      client.getValue("semver-flag", false, { custom: { appVersion: "2.1.0" } }),
    ).resolves.toBe(true);
    await expect(
      client.getValue("semver-flag", false, { custom: { appVersion: "1.9.9" } }),
    ).resolves.toBe(false);
  } finally {
    client.close();
  }
});

test("evaluates valid prerequisite flag rules through public config and the SDK", async ({
  request,
}) => {
  const { config, environment, project, sessionToken } = await createTargetingWorkspace(request, {
    configKey: "prerequisite-targeting",
    projectSlug: "prerequisite-targeting-project",
    userEmail: "prerequisite-targeting@capture-flag.test",
  });
  const prerequisiteFlag = await createFeatureFlagViaApi(request, sessionToken, config.id, {
    defaultValue: true,
    key: "release-enabled",
    name: "Release Enabled",
    type: "boolean",
  });
  const dependentFlag = await createFeatureFlagViaApi(request, sessionToken, config.id, {
    defaultValue: false,
    key: "dependent-feature",
    name: "Dependent Feature",
    type: "boolean",
  });
  await updateFeatureFlagValueViaApi(
    request,
    sessionToken,
    config.id,
    dependentFlag.id,
    environment.id,
    {
      rulesJson: [
        {
          conditions: [{ operator: "equals", prerequisiteFlag: "release-enabled", value: true }],
          serve: true,
        },
      ],
    },
  );
  const sdkKey = await createSdkKeyViaApi(request, sessionToken, project.id, {
    configId: config.id,
    environmentId: environment.id,
    name: "Prerequisite SDK Key",
  });
  const publicConfig = await getPublicConfigWithSdkKey(request, sdkKey.key ?? "");
  expect(publicConfig.body.flags["dependent-feature"].rules).toEqual([
    {
      conditions: [{ operator: "equals", prerequisiteFlag: "release-enabled", value: true }],
      serve: true,
    },
  ]);
  expect(publicConfig.body.flags["release-enabled"].defaultValue).toBe(true);

  const client = createClient({ baseUrl: apiUrl("/"), sdkKey: sdkKey.key ?? "" });
  try {
    await expect(client.getValue("dependent-feature", false)).resolves.toBe(true);
  } finally {
    client.close();
  }

  await updateFeatureFlagValueViaApi(
    request,
    sessionToken,
    config.id,
    prerequisiteFlag.id,
    environment.id,
    { defaultValue: false },
  );
  const updatedSdkKey = await createSdkKeyViaApi(request, sessionToken, project.id, {
    configId: config.id,
    environmentId: environment.id,
    name: "Prerequisite Updated SDK Key",
  });
  const updatedClient = createClient({ baseUrl: apiUrl("/"), sdkKey: updatedSdkKey.key ?? "" });
  try {
    await expect(updatedClient.getValue("dependent-feature", false)).resolves.toBe(false);
  } finally {
    updatedClient.close();
  }
});

test("rejects invalid prerequisite rules", async ({ request }) => {
  const { config, environment, sessionToken } = await createTargetingWorkspace(request, {
    configKey: "invalid-prerequisites",
    projectSlug: "invalid-prerequisites-project",
    userEmail: "invalid-prerequisites@capture-flag.test",
  });
  const flag = await createFeatureFlagViaApi(request, sessionToken, config.id, {
    defaultValue: false,
    key: "dependent-feature",
    name: "Dependent Feature",
    type: "boolean",
  });

  const missingPrerequisiteError = await expectJson<ApiError>(
    await request.patch(
      apiUrl(
        `/api/v1/configs/${config.id}/feature-flags/${flag.id}/environments/${environment.id}/value`,
      ),
      {
        data: {
          rulesJson: [
            {
              conditions: [{ operator: "equals", prerequisiteFlag: "missing-flag", value: true }],
              serve: true,
            },
          ],
        },
        headers: authHeaders(sessionToken),
      },
    ),
    400,
  );
  expect(missingPrerequisiteError).toMatchObject({
    message: "Prerequisite flag does not exist: missing-flag",
    statusCode: 400,
  });

  const selfPrerequisiteError = await expectJson<ApiError>(
    await request.patch(
      apiUrl(
        `/api/v1/configs/${config.id}/feature-flags/${flag.id}/environments/${environment.id}/value`,
      ),
      {
        data: {
          rulesJson: [
            {
              conditions: [
                { operator: "equals", prerequisiteFlag: "dependent-feature", value: true },
              ],
              serve: true,
            },
          ],
        },
        headers: authHeaders(sessionToken),
      },
    ),
    400,
  );
  expect(selfPrerequisiteError).toMatchObject({
    message: "Prerequisite flag cannot reference itself",
    statusCode: 400,
  });
});

test("protects prerequisite flags from rename and delete while referenced", async ({ request }) => {
  const { config, environment, sessionToken } = await createTargetingWorkspace(request, {
    configKey: "prerequisite-protection",
    projectSlug: "prerequisite-protection-project",
    userEmail: "prerequisite-protection@capture-flag.test",
  });
  const prerequisiteFlag = await createFeatureFlagViaApi(request, sessionToken, config.id, {
    defaultValue: true,
    key: "release-enabled",
    name: "Release Enabled",
    type: "boolean",
  });
  const dependentFlag = await createFeatureFlagViaApi(request, sessionToken, config.id, {
    defaultValue: false,
    key: "dependent-feature",
    name: "Dependent Feature",
    type: "boolean",
  });
  await updateFeatureFlagValueViaApi(
    request,
    sessionToken,
    config.id,
    dependentFlag.id,
    environment.id,
    {
      rulesJson: [
        {
          conditions: [{ operator: "equals", prerequisiteFlag: "release-enabled", value: true }],
          serve: true,
        },
      ],
    },
  );
  const previewBeforeRejectedWrites = await getConfigPreviewViaApi(
    request,
    sessionToken,
    config.id,
    environment.id,
  );

  const renameError = await expectJson<ApiError>(
    await request.patch(
      apiUrl(`/api/v1/configs/${config.id}/feature-flags/${prerequisiteFlag.id}`),
      {
        data: { key: "release-renamed" },
        headers: authHeaders(sessionToken),
      },
    ),
    400,
  );
  expect(renameError).toMatchObject({
    message:
      "Cannot rename flag while it is referenced as prerequisite by dependent-feature in production",
    statusCode: 400,
  });

  const deleteError = await expectJson<ApiError>(
    await request.delete(
      apiUrl(`/api/v1/configs/${config.id}/feature-flags/${prerequisiteFlag.id}`),
      {
        headers: authHeaders(sessionToken),
      },
    ),
    400,
  );
  expect(deleteError).toMatchObject({
    message:
      "Cannot delete flag while it is referenced as prerequisite by dependent-feature in production",
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

  await expect(
    updateFeatureFlagViaApi(request, sessionToken, config.id, prerequisiteFlag.id, {
      description: "Non-SDK-visible metadata can still change",
    }),
  ).resolves.toMatchObject({ id: prerequisiteFlag.id, key: "release-enabled" });
  await expect(
    deleteFeatureFlagViaApi(request, sessionToken, config.id, dependentFlag.id),
  ).resolves.toEqual({ ok: true });
});

async function createTargetingWorkspace(
  request: APIRequestContext,
  input: { configKey: string; projectSlug: string; userEmail: string },
): Promise<TargetingWorkspace> {
  const { project, sessionToken } = await createCoreWorkspace(request, {
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

  return { config, environment, project, sessionToken };
}
