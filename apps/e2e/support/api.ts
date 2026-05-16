import { expect, type APIRequestContext, type APIResponse } from "@playwright/test";
import { sessionCookieHeader } from "./auth";
import { apiBaseUrl } from "./env";

export function apiUrl(path: string) {
  return new URL(path, apiBaseUrl).toString();
}

export function authHeaders(sessionToken: string) {
  return {
    cookie: sessionCookieHeader(sessionToken),
  };
}

export async function expectJson<TResponse>(response: APIResponse, expectedStatus = 200) {
  expect(response.status()).toBe(expectedStatus);
  return (await response.json()) as TResponse;
}

export async function apiGetJson<TResponse>(
  request: APIRequestContext,
  path: string,
  sessionToken: string,
) {
  return expectJson<TResponse>(
    await request.get(apiUrl(path), {
      headers: authHeaders(sessionToken),
    }),
  );
}

export async function apiPostJson<TResponse>(
  request: APIRequestContext,
  path: string,
  sessionToken: string,
  body: unknown,
  expectedStatus = 201,
) {
  return expectJson<TResponse>(
    await request.post(apiUrl(path), {
      data: body,
      headers: authHeaders(sessionToken),
    }),
    expectedStatus,
  );
}

export async function apiPatchJson<TResponse>(
  request: APIRequestContext,
  path: string,
  sessionToken: string,
  body: unknown,
) {
  return expectJson<TResponse>(
    await request.patch(apiUrl(path), {
      data: body,
      headers: authHeaders(sessionToken),
    }),
  );
}
