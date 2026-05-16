import type { APIRequestContext } from "@playwright/test";
import { apiDeleteJson, apiGetJson, apiPatchJson, apiPostJson } from "./api";

export type FeatureFlagType =
  | "boolean"
  | "string"
  | "integer"
  | "double"
  | "json_object"
  | "json_array";

export type FeatureFlagEnvironmentValue = {
  defaultValue: unknown;
  environment: {
    id: string;
    key: string;
    name: string;
    sortOrder: number;
  };
  environmentId: string;
  featureFlagId: string;
  id: string;
  percentageAttribute: string;
  percentageOptionsJson: unknown[];
  rulesJson: unknown[];
};

export type FeatureFlag = {
  deletedAt: string | null;
  description: string | null;
  environmentValues: FeatureFlagEnvironmentValue[];
  hint: string | null;
  id: string;
  key: string;
  name: string;
  ownerUserId: string | null;
  tags: string[];
  type: FeatureFlagType;
};

export type PublicConfigFlag = {
  defaultValue: unknown;
  percentageAttribute: string;
  percentageOptions: unknown[];
  rules: unknown[];
  type: FeatureFlagType;
};

export type PublicConfig = {
  configKey: string;
  environment: string;
  flags: Record<string, PublicConfigFlag>;
  generatedAt: string;
  projectKey: string;
  revision: number;
  schemaVersion: 1;
  segments: Record<string, unknown>;
};

export type ConfigPreview = {
  body: PublicConfig;
  etag: string;
};

export type FeatureFlagActivityResponse = {
  items: Array<{
    action: string;
    entityId: string;
    entityType: string;
    id: string;
    metadata: unknown;
  }>;
  nextCursor: string | null;
};

export type OkResponse = {
  ok: true;
};

export async function listFeatureFlagsViaApi(
  request: APIRequestContext,
  sessionToken: string,
  configId: string,
) {
  return apiGetJson<FeatureFlag[]>(
    request,
    `/api/v1/configs/${configId}/feature-flags`,
    sessionToken,
  );
}

export async function createFeatureFlagViaApi(
  request: APIRequestContext,
  sessionToken: string,
  configId: string,
  input: {
    defaultValue?: unknown;
    description?: string;
    hint?: string;
    key: string;
    name: string;
    tags?: string[];
    type: FeatureFlagType;
  },
) {
  return apiPostJson<FeatureFlag>(
    request,
    `/api/v1/configs/${configId}/feature-flags`,
    sessionToken,
    input,
  );
}

export async function updateFeatureFlagViaApi(
  request: APIRequestContext,
  sessionToken: string,
  configId: string,
  featureFlagId: string,
  input: {
    description?: string;
    hint?: string;
    key?: string;
    name?: string;
    ownerUserId?: string | null;
    tags?: string[];
  },
) {
  return apiPatchJson<FeatureFlag>(
    request,
    `/api/v1/configs/${configId}/feature-flags/${featureFlagId}`,
    sessionToken,
    input,
  );
}

export async function updateFeatureFlagValueViaApi(
  request: APIRequestContext,
  sessionToken: string,
  configId: string,
  featureFlagId: string,
  environmentId: string,
  input: {
    defaultValue?: unknown;
    percentageAttribute?: string;
    percentageOptionsJson?: unknown;
    rulesJson?: unknown;
  },
) {
  return apiPatchJson<FeatureFlagEnvironmentValue>(
    request,
    `/api/v1/configs/${configId}/feature-flags/${featureFlagId}/environments/${environmentId}/value`,
    sessionToken,
    input,
  );
}

export async function deleteFeatureFlagViaApi(
  request: APIRequestContext,
  sessionToken: string,
  configId: string,
  featureFlagId: string,
) {
  return apiDeleteJson<OkResponse>(
    request,
    `/api/v1/configs/${configId}/feature-flags/${featureFlagId}`,
    sessionToken,
  );
}

export async function getConfigPreviewViaApi(
  request: APIRequestContext,
  sessionToken: string,
  configId: string,
  environmentId: string,
) {
  return apiGetJson<ConfigPreview>(
    request,
    `/api/v1/configs/${configId}/environments/${environmentId}/config-preview`,
    sessionToken,
  );
}

export async function listFeatureFlagActivityViaApi(
  request: APIRequestContext,
  sessionToken: string,
  configId: string,
  featureFlagId: string,
  query: { cursor?: string; limit?: number } = {},
) {
  const searchParams = new URLSearchParams();
  if (query.limit !== undefined) {
    searchParams.set("limit", String(query.limit));
  }
  if (query.cursor) {
    searchParams.set("cursor", query.cursor);
  }

  const queryString = searchParams.toString();
  return apiGetJson<FeatureFlagActivityResponse>(
    request,
    `/api/v1/configs/${configId}/feature-flags/${featureFlagId}/activity${queryString ? `?${queryString}` : ""}`,
    sessionToken,
  );
}
