import { apiRequest, apiV1BaseUrl, deleteJson, patchJson, postJson } from "@api/client";
import { mockApiError, mockApiSuccess } from "@src/test/api";
import { describe, expect, it, vi } from "vitest";

describe("apiRequest", () => {
  it("sends authenticated JSON requests and parses successful responses", async () => {
    const fetchMock = mockApiSuccess({ id: "resource-1" });

    await expect(apiRequest("resources", { method: "GET" })).resolves.toEqual({
      id: "resource-1",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `${apiV1BaseUrl}/resources`,
      expect.objectContaining({
        credentials: "include",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        method: "GET",
      }),
    );
  });

  it("keeps explicit request headers", async () => {
    const fetchMock = mockApiSuccess({ ok: true });

    await apiRequest("/resources", {
      headers: { "X-Trace-Id": "trace-1" },
      method: "GET",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `${apiV1BaseUrl}/resources`,
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-Trace-Id": "trace-1",
        }),
      }),
    );
  });

  it("throws API error messages", async () => {
    mockApiError({ message: "Invalid input" }, 422);

    await expect(apiRequest("resources")).rejects.toThrow("Invalid input");
  });

  it("joins array API error messages", async () => {
    mockApiError({ message: ["Name is required", "Key is required"] }, 422);

    await expect(apiRequest("resources")).rejects.toThrow("Name is required, Key is required");
  });

  it("falls back to the HTTP status text when error JSON is unavailable", async () => {
    const fetchMock = viFetch(
      new Response("not-json", {
        status: 500,
        statusText: "Internal Server Error",
      }),
    );

    await expect(apiRequest("resources")).rejects.toThrow("Internal Server Error");
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});

describe("JSON request helpers", () => {
  it("posts JSON bodies", async () => {
    const fetchMock = mockApiSuccess({ id: "created" });

    await expect(postJson("resources", { name: "Created" })).resolves.toEqual({ id: "created" });

    const [, init] = fetchMock.mock.calls[0];

    expect(init).toEqual(
      expect.objectContaining({
        body: JSON.stringify({ name: "Created" }),
        method: "POST",
      }),
    );
  });

  it("patches JSON bodies", async () => {
    const fetchMock = mockApiSuccess({ id: "updated" });

    await expect(patchJson("resources/resource-1", { name: "Updated" })).resolves.toEqual({
      id: "updated",
    });

    const [, init] = fetchMock.mock.calls[0];

    expect(init).toEqual(
      expect.objectContaining({
        body: JSON.stringify({ name: "Updated" }),
        method: "PATCH",
      }),
    );
  });

  it("deletes JSON resources", async () => {
    const fetchMock = mockApiSuccess({ ok: true });

    await expect(deleteJson("resources/resource-1")).resolves.toEqual({ ok: true });

    const [, init] = fetchMock.mock.calls[0];

    expect(init).toEqual(expect.objectContaining({ method: "DELETE" }));
  });
});

function viFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);

  vi.spyOn(globalThis, "fetch").mockImplementation(fetchMock);

  return fetchMock;
}
