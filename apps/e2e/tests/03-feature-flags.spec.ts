import { type APIRequestContext, expect, test } from "@playwright/test";
import { apiGetJson, apiPostJson } from "../support/api";
import { disconnectDatabase } from "../support/db";
import {
  type FeatureFlagType,
  type PublicConfig,
  createFeatureFlagViaApi,
  deleteFeatureFlagViaApi,
  getConfigPreviewViaApi,
  listFeatureFlagActivityViaApi,
  listFeatureFlagsViaApi,
  updateFeatureFlagValueViaApi,
  updateFeatureFlagViaApi,
} from "../support/feature-flags";
import { resetDatabase } from "../support/reset";
import {
  type Config,
  type Environment,
  type Project,
  createConfigViaApi,
  createCoreWorkspace,
  createEnvironmentViaApi,
} from "../support/workspace";

type FeatureFlagWorkspace = {
  config: Config;
  environment: Environment;
  project: Project;
  sessionToken: string;
};

type SdkKey = {
  id: string;
  key: string;
  keyPrefix: string;
};

const explicitDefaultCases: Array<{
  defaultValue: unknown;
  key: string;
  type: FeatureFlagType;
}> = [
  { defaultValue: true, key: "boolean-flag", type: "boolean" },
  { defaultValue: "enabled", key: "string-flag", type: "string" },
  { defaultValue: 42, key: "integer-flag", type: "integer" },
  { defaultValue: 3.14, key: "double-flag", type: "double" },
  { defaultValue: { enabled: true }, key: "object-flag", type: "json_object" },
  { defaultValue: ["a", "b"], key: "array-flag", type: "json_array" },
];

const implicitDefaultCases: Array<{
  defaultValue: unknown;
  key: string;
  type: FeatureFlagType;
}> = [
  { defaultValue: false, key: "implicit-boolean", type: "boolean" },
  { defaultValue: "", key: "implicit-string", type: "string" },
  { defaultValue: 0, key: "implicit-integer", type: "integer" },
  { defaultValue: 0, key: "implicit-double", type: "double" },
  { defaultValue: {}, key: "implicit-object", type: "json_object" },
  { defaultValue: [], key: "implicit-array", type: "json_array" },
];

test.beforeEach(async () => {
  await resetDatabase();
});

test.afterAll(async () => {
  await disconnectDatabase();
});

test("creates and lists feature flags for every supported type", async ({ request }) => {
  const { config, environment, project, sessionToken } = await createFeatureFlagWorkspace(request, {
    configKey: "typed-flags",
    projectSlug: "typed-flags-project",
    userEmail: "typed-flags@capture-flag.test",
  });
  const secondEnvironment = await createEnvironmentViaApi(request, sessionToken, project.id, {
    key: "staging",
    name: "Staging",
  });

  const initialFlags = await listFeatureFlagsViaApi(request, sessionToken, config.id);
  expect(initialFlags).toEqual([]);

  for (const flagCase of [...explicitDefaultCases, ...implicitDefaultCases]) {
    const flag = await createFeatureFlagViaApi(request, sessionToken, config.id, {
      ...(flagCase.key.startsWith("implicit") ? {} : { defaultValue: flagCase.defaultValue }),
      key: flagCase.key,
      name: flagCase.key,
      type: flagCase.type,
    });

    expect(flag).toMatchObject({ key: flagCase.key, type: flagCase.type });
    expect(flag.environmentValues).toHaveLength(2);
    expect(flag.environmentValues.map((value) => value.environmentId).sort()).toEqual(
      [environment.id, secondEnvironment.id].sort(),
    );
    for (const value of flag.environmentValues) {
      expect(value).toMatchObject({
        defaultValue: flagCase.defaultValue,
        percentageAttribute: "identifier",
        percentageOptionsJson: [],
        rulesJson: [],
      });
    }
  }

  const flags = await listFeatureFlagsViaApi(request, sessionToken, config.id);
  expect(flags.map((flag) => flag.key)).toEqual([
    ...explicitDefaultCases.map((flagCase) => flagCase.key),
    ...implicitDefaultCases.map((flagCase) => flagCase.key),
  ]);
});

test("updates environment values and keeps no-op updates from changing public state", async ({
  request,
}) => {
  const { config, environment, sessionToken } = await createFeatureFlagWorkspace(request, {
    configKey: "value-updates",
    projectSlug: "value-updates-project",
    userEmail: "value-updates@capture-flag.test",
  });
  const flag = await createFeatureFlagViaApi(request, sessionToken, config.id, {
    defaultValue: false,
    key: "value-flag",
    name: "Value Flag",
    type: "boolean",
  });
  const previewBeforeUpdate = await getConfigPreviewViaApi(
    request,
    sessionToken,
    config.id,
    environment.id,
  );

  const updatedValue = await updateFeatureFlagValueViaApi(
    request,
    sessionToken,
    config.id,
    flag.id,
    environment.id,
    { defaultValue: true },
  );
  expect(updatedValue).toMatchObject({
    defaultValue: true,
    environmentId: environment.id,
    featureFlagId: flag.id,
  });

  const previewAfterUpdate = await getConfigPreviewViaApi(
    request,
    sessionToken,
    config.id,
    environment.id,
  );
  expect(previewAfterUpdate.body.revision).toBeGreaterThan(previewBeforeUpdate.body.revision);
  expect(previewAfterUpdate.etag).not.toBe(previewBeforeUpdate.etag);
  expect(previewAfterUpdate.body.flags["value-flag"].defaultValue).toBe(true);

  const activityBeforeNoop = await listFeatureFlagActivityViaApi(
    request,
    sessionToken,
    config.id,
    flag.id,
  );
  await updateFeatureFlagValueViaApi(request, sessionToken, config.id, flag.id, environment.id, {
    defaultValue: true,
  });
  const previewAfterNoop = await getConfigPreviewViaApi(
    request,
    sessionToken,
    config.id,
    environment.id,
  );
  const activityAfterNoop = await listFeatureFlagActivityViaApi(
    request,
    sessionToken,
    config.id,
    flag.id,
  );

  expect(previewAfterNoop.body.revision).toBe(previewAfterUpdate.body.revision);
  expect(previewAfterNoop.etag).toBe(previewAfterUpdate.etag);
  expect(activityAfterNoop.items.map((item) => item.id)).toEqual(
    activityBeforeNoop.items.map((item) => item.id),
  );
});

test("updates metadata, renames SDK-visible keys, and paginates activity", async ({ request }) => {
  const { config, environment, sessionToken } = await createFeatureFlagWorkspace(request, {
    configKey: "metadata-updates",
    projectSlug: "metadata-updates-project",
    userEmail: "metadata-updates@capture-flag.test",
  });
  const flag = await createFeatureFlagViaApi(request, sessionToken, config.id, {
    defaultValue: "control",
    key: "metadata-flag",
    name: "Metadata Flag",
    type: "string",
  });
  const previewBeforeMetadata = await getConfigPreviewViaApi(
    request,
    sessionToken,
    config.id,
    environment.id,
  );

  const metadataUpdatedFlag = await updateFeatureFlagViaApi(
    request,
    sessionToken,
    config.id,
    flag.id,
    {
      description: "Updated description",
      hint: "Use for metadata update coverage",
      name: "Metadata Flag Updated",
      tags: [" beta ", "release", "beta"],
    },
  );
  expect(metadataUpdatedFlag).toMatchObject({
    description: "Updated description",
    hint: "Use for metadata update coverage",
    id: flag.id,
    key: "metadata-flag",
    name: "Metadata Flag Updated",
    tags: ["beta", "release"],
  });

  const previewAfterMetadata = await getConfigPreviewViaApi(
    request,
    sessionToken,
    config.id,
    environment.id,
  );
  expect(previewAfterMetadata.body.revision).toBe(previewBeforeMetadata.body.revision);
  expect(previewAfterMetadata.etag).toBe(previewBeforeMetadata.etag);
  expect(previewAfterMetadata.body.flags).toHaveProperty("metadata-flag");

  const keyUpdatedFlag = await updateFeatureFlagViaApi(request, sessionToken, config.id, flag.id, {
    key: "metadata-flag-renamed",
  });
  expect(keyUpdatedFlag).toMatchObject({ id: flag.id, key: "metadata-flag-renamed" });

  const previewAfterKeyUpdate = await getConfigPreviewViaApi(
    request,
    sessionToken,
    config.id,
    environment.id,
  );
  expect(previewAfterKeyUpdate.body.revision).toBeGreaterThan(previewAfterMetadata.body.revision);
  expect(previewAfterKeyUpdate.etag).not.toBe(previewAfterMetadata.etag);
  expect(previewAfterKeyUpdate.body.flags).not.toHaveProperty("metadata-flag");
  expect(previewAfterKeyUpdate.body.flags).toHaveProperty("metadata-flag-renamed");

  const activity = await listFeatureFlagActivityViaApi(request, sessionToken, config.id, flag.id);
  expect(activity.items.map((item) => item.action)).toEqual(
    expect.arrayContaining(["flag.created", "flag.updated"]),
  );
  const firstPage = await listFeatureFlagActivityViaApi(request, sessionToken, config.id, flag.id, {
    limit: 1,
  });
  expect(firstPage.items).toHaveLength(1);
  expect(firstPage.nextCursor).toEqual(expect.any(String));
  const secondPage = await listFeatureFlagActivityViaApi(
    request,
    sessionToken,
    config.id,
    flag.id,
    {
      cursor: firstPage.nextCursor ?? undefined,
      limit: 1,
    },
  );
  expect(secondPage.items).toHaveLength(1);
  expect(secondPage.items[0].id).not.toBe(firstPage.items[0].id);
});

test("soft deletes flags and removes them from private and public config", async ({ request }) => {
  const { config, environment, project, sessionToken } = await createFeatureFlagWorkspace(request, {
    configKey: "soft-delete",
    projectSlug: "soft-delete-project",
    userEmail: "soft-delete@capture-flag.test",
  });
  const flag = await createFeatureFlagViaApi(request, sessionToken, config.id, {
    defaultValue: true,
    key: "delete-me",
    name: "Delete Me",
    type: "boolean",
  });
  const sdkKey = await createSdkKey(request, sessionToken, project.id, config.id, environment.id);
  const previewBeforeDelete = await getConfigPreviewViaApi(
    request,
    sessionToken,
    config.id,
    environment.id,
  );
  expect(previewBeforeDelete.body.flags).toHaveProperty("delete-me");

  await expect(deleteFeatureFlagViaApi(request, sessionToken, config.id, flag.id)).resolves.toEqual(
    { ok: true },
  );

  const flagsAfterDelete = await listFeatureFlagsViaApi(request, sessionToken, config.id);
  expect(flagsAfterDelete.map((item) => item.id)).not.toContain(flag.id);

  const previewAfterDelete = await getConfigPreviewViaApi(
    request,
    sessionToken,
    config.id,
    environment.id,
  );
  expect(previewAfterDelete.body.revision).toBeGreaterThan(previewBeforeDelete.body.revision);
  expect(previewAfterDelete.etag).not.toBe(previewBeforeDelete.etag);
  expect(previewAfterDelete.body.flags).not.toHaveProperty("delete-me");

  const publicConfig = await getPublicConfig(request, sdkKey.key);
  expect(publicConfig).toEqual(previewAfterDelete.body);
  expect(publicConfig.flags).not.toHaveProperty("delete-me");
});

async function createFeatureFlagWorkspace(
  request: APIRequestContext,
  input: { configKey: string; projectSlug: string; userEmail: string },
): Promise<FeatureFlagWorkspace> {
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
    name: "Feature flag E2E SDK Key",
  });
}

async function getPublicConfig(request: APIRequestContext, sdkKey: string) {
  return apiGetJson<PublicConfig>(
    request,
    `/public-api/v1/sdk/${encodeURIComponent(sdkKey)}/config`,
    "",
  );
}
