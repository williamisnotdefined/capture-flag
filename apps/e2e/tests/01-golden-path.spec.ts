import { createClient } from "@capture-flag/sdk-js";
import { expect, test } from "@playwright/test";
import { apiGetJson, apiPatchJson, apiPostJson, apiUrl } from "../support/api";
import { createAuthenticatedUser } from "../support/auth";
import { disconnectDatabase } from "../support/db";
import { apiBaseUrl } from "../support/env";
import { resetDatabase } from "../support/reset";

type Organization = {
  id: string;
  name: string;
  role: string;
  slug: string;
};

type Project = {
  configs: Config[];
  environments: Environment[];
  id: string;
  name: string;
  organizationId: string;
  slug: string;
};

type Environment = {
  id: string;
  key: string;
  name: string;
  projectId: string;
  sortOrder: number;
};

type Config = {
  id: string;
  key: string;
  name: string;
  projectId: string;
};

type FeatureFlag = {
  environmentValues: FeatureFlagEnvironmentValue[];
  id: string;
  key: string;
  name: string;
  type: string;
};

type FeatureFlagEnvironmentValue = {
  defaultValue: unknown;
  environmentId: string;
  featureFlagId: string;
  percentageAttribute: string;
  percentageOptionsJson: unknown[];
  rulesJson: unknown[];
};

type SdkKey = {
  id: string;
  key: string;
  keyPrefix: string;
};

type PublicConfig = {
  configKey: string;
  environment: string;
  flags: Record<
    string,
    {
      defaultValue: unknown;
      percentageAttribute: string;
      percentageOptions: unknown[];
      rules: unknown[];
      type: string;
    }
  >;
  generatedAt: string;
  projectKey: string;
  revision: number;
  schemaVersion: 1;
  segments: Record<string, unknown>;
};

type ConfigPreview = {
  body: PublicConfig;
  etag: string;
};

test.beforeEach(async () => {
  await resetDatabase();
});

test.afterAll(async () => {
  await disconnectDatabase();
});

test("creates a flag and serves it through public config and the SDK", async ({ request }) => {
  const { sessionToken } = await createAuthenticatedUser({
    email: "golden-path@capture-flag.test",
    name: "Golden Path User",
  });

  const organization = await apiPostJson<Organization>(
    request,
    "/api/v1/organizations",
    sessionToken,
    {
      name: "Golden Org",
      slug: "golden-org",
    },
  );
  expect(organization).toMatchObject({ name: "Golden Org", role: "owner", slug: "golden-org" });

  const project = await apiPostJson<Project>(
    request,
    `/api/v1/organizations/${organization.id}/projects`,
    sessionToken,
    {
      name: "Golden Project",
      slug: "golden-project",
    },
  );
  expect(project).toMatchObject({
    name: "Golden Project",
    organizationId: organization.id,
    slug: "golden-project",
  });
  expect(project.configs).toHaveLength(1);
  expect(project.configs[0]).toMatchObject({ key: "default", name: "Default" });

  const environment = await apiPostJson<Environment>(
    request,
    `/api/v1/projects/${project.id}/environments`,
    sessionToken,
    {
      key: "production",
      name: "Production",
    },
  );
  expect(environment).toMatchObject({
    key: "production",
    name: "Production",
    projectId: project.id,
    sortOrder: 1,
  });

  const config = await apiPostJson<Config>(
    request,
    `/api/v1/projects/${project.id}/configs`,
    sessionToken,
    {
      key: "frontend-web",
      name: "Frontend Web",
    },
  );
  expect(config).toMatchObject({
    key: "frontend-web",
    name: "Frontend Web",
    projectId: project.id,
  });

  const flag = await apiPostJson<FeatureFlag>(
    request,
    `/api/v1/configs/${config.id}/feature-flags`,
    sessionToken,
    {
      defaultValue: false,
      key: "new-checkout",
      name: "New Checkout",
      tags: ["checkout", "release"],
      type: "boolean",
    },
  );
  expect(flag).toMatchObject({ key: "new-checkout", name: "New Checkout", type: "boolean" });
  expect(flag.environmentValues).toHaveLength(1);
  expect(flag.environmentValues[0]).toMatchObject({
    defaultValue: false,
    environmentId: environment.id,
    featureFlagId: flag.id,
    percentageAttribute: "identifier",
    percentageOptionsJson: [],
    rulesJson: [],
  });

  const previewBeforeUpdate = await apiGetJson<ConfigPreview>(
    request,
    `/api/v1/configs/${config.id}/environments/${environment.id}/config-preview`,
    sessionToken,
  );
  expect(previewBeforeUpdate.body).toMatchObject({
    configKey: "frontend-web",
    environment: "production",
    flags: {
      "new-checkout": {
        defaultValue: false,
        percentageAttribute: "identifier",
        percentageOptions: [],
        rules: [],
        type: "boolean",
      },
    },
    projectKey: "golden-project",
    schemaVersion: 1,
    segments: {},
  });

  const updatedValue = await apiPatchJson<FeatureFlagEnvironmentValue>(
    request,
    `/api/v1/configs/${config.id}/feature-flags/${flag.id}/environments/${environment.id}/value`,
    sessionToken,
    { defaultValue: true },
  );
  expect(updatedValue).toMatchObject({
    defaultValue: true,
    environmentId: environment.id,
    featureFlagId: flag.id,
  });

  const previewAfterUpdate = await apiGetJson<ConfigPreview>(
    request,
    `/api/v1/configs/${config.id}/environments/${environment.id}/config-preview`,
    sessionToken,
  );
  expect(previewAfterUpdate.body.revision).toBeGreaterThan(previewBeforeUpdate.body.revision);
  expect(previewAfterUpdate.etag).not.toBe(previewBeforeUpdate.etag);
  expect(previewAfterUpdate.body.flags["new-checkout"]).toMatchObject({
    defaultValue: true,
    percentageAttribute: "identifier",
    percentageOptions: [],
    rules: [],
    type: "boolean",
  });

  const sdkKey = await apiPostJson<SdkKey>(
    request,
    `/api/v1/projects/${project.id}/sdk-keys`,
    sessionToken,
    {
      configId: config.id,
      environmentId: environment.id,
      name: "Golden Path SDK Key",
    },
  );
  expect(sdkKey.key).toMatch(/^cf_sdk_/);
  expect(sdkKey.keyPrefix).toBe(sdkKey.key.slice(0, 18));

  const publicConfigResponse = await request.get(
    apiUrl(`/public-api/v1/sdk/${encodeURIComponent(sdkKey.key)}/config`),
  );
  expect(publicConfigResponse.status()).toBe(200);
  expect(publicConfigResponse.headers()["cache-control"]).toBe("private, no-cache");
  expect(publicConfigResponse.headers().etag).toBe(previewAfterUpdate.etag);
  const publicConfig = (await publicConfigResponse.json()) as PublicConfig;
  expect(publicConfig).toEqual(previewAfterUpdate.body);

  const notModifiedResponse = await request.get(
    apiUrl(`/public-api/v1/sdk/${encodeURIComponent(sdkKey.key)}/config`),
    {
      headers: {
        "If-None-Match": publicConfigResponse.headers().etag,
      },
    },
  );
  expect(notModifiedResponse.status()).toBe(304);
  await expect(notModifiedResponse.text()).resolves.toBe("");

  const client = createClient({ baseUrl: apiBaseUrl, sdkKey: sdkKey.key });
  try {
    await expect(
      client.getValue("new-checkout", false, { identifier: "golden-user" }),
    ).resolves.toBe(true);
  } finally {
    client.close();
  }
});
