import { vi } from "vitest";

export function mockApiSuccess(payload: unknown, init: ResponseInit = {}) {
  return mockFetchResponse(payload, { status: 200, ...init });
}

export function mockApiError(payload: unknown = { message: "Request failed" }, status = 400) {
  return mockFetchResponse(payload, { status });
}

export function mockFetchResponse(payload: unknown, init: ResponseInit = {}) {
  const response = new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const fetchMock = vi.fn().mockResolvedValue(response);

  vi.spyOn(globalThis, "fetch").mockImplementation(fetchMock);

  return fetchMock;
}

export type MockApiRoute = {
  method?: string;
  path: RegExp | string;
  payload: unknown;
  status?: number;
};

export function mockApiRoutes(routes: readonly MockApiRoute[]) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = toUrl(input);
    const method = (init?.method ?? "GET").toUpperCase();
    const path = url.pathname.replace(/^\/api\/v1/, "") || "/";
    const route = routes.find((candidate) => {
      const candidateMethod = (candidate.method ?? "GET").toUpperCase();

      if (candidateMethod !== method) {
        return false;
      }

      return typeof candidate.path === "string"
        ? candidate.path === path
        : candidate.path.test(path);
    });
    const payload = route?.payload ?? { message: `Unhandled ${method} ${path}` };
    const status = route?.status ?? (route ? 200 : 500);

    return new Response(JSON.stringify(payload), {
      headers: { "Content-Type": "application/json" },
      status,
    });
  });

  vi.spyOn(globalThis, "fetch").mockImplementation(fetchMock);

  return fetchMock;
}

function toUrl(input: RequestInfo | URL) {
  const rawUrl = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

  return new URL(rawUrl, window.location.origin);
}
