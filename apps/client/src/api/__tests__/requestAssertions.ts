import { apiV1BaseUrl } from "@api/client";
import { mockApiError, mockApiSuccess } from "@src/test/api";
import { expect } from "vitest";

export type ApiRequestCase = {
  body?: unknown;
  call: () => Promise<unknown>;
  method?: string;
  name: string;
  path: string;
};

export async function expectApiSuccess({ body, call, method = "GET", path }: ApiRequestCase) {
  const payload = { id: "response-1" };
  const fetchMock = mockApiSuccess(payload);

  await expect(call()).resolves.toEqual(payload);

  const [url, init] = fetchMock.mock.calls[0];

  expect(url).toBe(`${apiV1BaseUrl}${path}`);
  expect(init).toEqual(
    expect.objectContaining({
      credentials: "include",
      headers: expect.objectContaining({ "Content-Type": "application/json" }),
    }),
  );

  expect(init?.method ?? "GET").toBe(method);

  if (body === undefined) {
    expect(init?.body).toBeUndefined();
  } else {
    expect(JSON.parse(String(init?.body))).toEqual(body);
  }
}

export async function expectApiError({ call }: ApiRequestCase) {
  mockApiError({ message: "Request rejected" }, 409);

  await expect(call()).rejects.toThrow("Request rejected");
}
