import { createHash, randomBytes } from "node:crypto";
import type { APIRequestContext } from "@playwright/test";
import { apiGetJson, apiPostJson } from "./api";
import { prisma } from "./db";

export type ApiTokenScope =
  | "projects:read"
  | "projects:write"
  | "configs:read"
  | "configs:write"
  | "members:read"
  | "members:write"
  | "flags:read"
  | "flags:write"
  | "environments:read"
  | "segments:read"
  | "segments:write";

export type ApiToken = {
  createdAt: string;
  expiresAt: string | null;
  id: string;
  lastUsedAt: string | null;
  name: string;
  organizationId: string;
  projectId: string | null;
  revokedAt: string | null;
  scopes: ApiTokenScope[];
  token?: string;
  tokenPrefix: string;
  updatedAt: string;
  user: {
    avatarUrl: string | null;
    email: string | null;
    id: string;
    name: string;
  };
  userId: string;
};

export async function listApiTokensViaApi(
  request: APIRequestContext,
  sessionToken: string,
  organizationId: string,
) {
  return apiGetJson<ApiToken[]>(
    request,
    `/api/v1/organizations/${organizationId}/api-tokens`,
    sessionToken,
  );
}

export async function createApiTokenViaApi(
  request: APIRequestContext,
  sessionToken: string,
  organizationId: string,
  input: {
    expiresAt?: string;
    name: string;
    projectId?: string;
    scopes: ApiTokenScope[];
  },
) {
  return apiPostJson<ApiToken>(
    request,
    `/api/v1/organizations/${organizationId}/api-tokens`,
    sessionToken,
    input,
  );
}

export async function revokeApiTokenViaApi(
  request: APIRequestContext,
  sessionToken: string,
  apiTokenId: string,
) {
  return apiPostJson<ApiToken>(
    request,
    `/api/v1/api-tokens/${apiTokenId}/revoke`,
    sessionToken,
    {},
  );
}

export function apiTokenHeaders(rawToken: string) {
  return {
    authorization: `Bearer ${rawToken}`,
  };
}

export async function createExpiredApiTokenViaDb(input: {
  organizationId: string;
  projectId?: string | null;
  scopes: ApiTokenScope[];
  userId: string;
}) {
  const rawToken = createRawApiToken();
  const apiToken = await prisma.apiToken.create({
    data: {
      expiresAt: new Date(Date.now() - 60_000),
      name: "Expired E2E API Token",
      organizationId: input.organizationId,
      projectId: input.projectId ?? null,
      scopes: input.scopes,
      tokenHash: hashApiToken(rawToken),
      tokenPrefix: rawToken.slice(0, 18),
      userId: input.userId,
    },
  });

  return { apiToken, rawToken };
}

function createRawApiToken() {
  return `cf_api_${randomBytes(10).toString("hex")}_${randomBytes(32).toString("base64url")}`;
}

function hashApiToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}
