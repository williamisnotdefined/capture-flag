import { type APIRequestContext, expect } from "@playwright/test";
import { apiGetJson, apiPostJson, apiUrl } from "./api";
import type { PublicConfig } from "./feature-flags";

export type SdkKey = {
  config: {
    id: string;
    key: string;
    name: string;
  };
  configId: string;
  createdAt: string;
  environment: {
    id: string;
    key: string;
    name: string;
  };
  environmentId: string;
  id: string;
  key?: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  name: string;
  projectId: string;
  revokedAt: string | null;
  updatedAt: string;
};

export async function listSdkKeysViaApi(
  request: APIRequestContext,
  sessionToken: string,
  projectId: string,
) {
  return apiGetJson<SdkKey[]>(request, `/api/v1/projects/${projectId}/sdk-keys`, sessionToken);
}

export async function createSdkKeyViaApi(
  request: APIRequestContext,
  sessionToken: string,
  projectId: string,
  input: { configId: string; environmentId: string; name?: string },
) {
  return apiPostJson<SdkKey>(
    request,
    `/api/v1/projects/${projectId}/sdk-keys`,
    sessionToken,
    input,
  );
}

export async function revokeSdkKeyViaApi(
  request: APIRequestContext,
  sessionToken: string,
  sdkKeyId: string,
) {
  return apiPostJson<SdkKey>(request, `/api/v1/sdk-keys/${sdkKeyId}/revoke`, sessionToken, {});
}

export async function rotateSdkKeyViaApi(
  request: APIRequestContext,
  sessionToken: string,
  sdkKeyId: string,
) {
  return apiPostJson<SdkKey>(request, `/api/v1/sdk-keys/${sdkKeyId}/rotate`, sessionToken, {});
}

export async function getPublicConfigWithSdkKey(request: APIRequestContext, rawSdkKey: string) {
  const response = await request.get(
    apiUrl(`/public-api/v1/sdk/${encodeURIComponent(rawSdkKey)}/config`),
  );
  expect(response.status()).toBe(200);

  return {
    body: (await response.json()) as PublicConfig,
    cacheControl: response.headers()["cache-control"],
    etag: response.headers().etag,
  };
}

export async function expectPublicSdkKeyNotFound(request: APIRequestContext, rawSdkKey: string) {
  const response = await request.get(
    apiUrl(`/public-api/v1/sdk/${encodeURIComponent(rawSdkKey)}/config`),
  );
  expect(response.status()).toBe(404);
}
