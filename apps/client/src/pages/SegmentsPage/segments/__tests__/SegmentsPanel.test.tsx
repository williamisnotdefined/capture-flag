import { SegmentsPage } from "@pages/SegmentsPage/SegmentsPage";
import { mockDefaultApiRoutes, segmentsRoutePath } from "@src/test/pageApi";
import { renderRouteWithProviders } from "@src/test/render";
import { segmentsRoute } from "@stories/mockData";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SegmentsPanel, parseSegmentConditions } from "../SegmentsPanel";

describe("segment condition parsing", () => {
  it("rejects attributes longer than the API limit", () => {
    const conditions = JSON.stringify([
      { attribute: "a".repeat(81), operator: "equals", value: true },
    ]);

    expect(() => parseSegmentConditions(conditions)).toThrow(/80/);
  });

  it("rejects excessive conditions", () => {
    const conditions = JSON.stringify(
      Array.from({ length: 51 }, () => ({
        attribute: "country",
        operator: "equals",
        value: "BR",
      })),
    );

    expect(() => parseSegmentConditions(conditions)).toThrow(/50/);
  });

  it("normalizes valid conditions", () => {
    expect(
      parseSegmentConditions(
        JSON.stringify([{ attribute: " email ", operator: "endsWith", value: "@example.com" }]),
      ),
    ).toEqual([{ attribute: "email", operator: "endsWith", value: "@example.com" }]);
  });

  it("rejects unsupported condition shapes", () => {
    expect(() => parseSegmentConditions(JSON.stringify([null]))).toThrow(/objetos/);
    expect(() =>
      parseSegmentConditions(
        JSON.stringify([{ attribute: "country", operator: "unknown", value: "BR" }]),
      ),
    ).toThrow(/operator valido/);
    expect(() =>
      parseSegmentConditions(
        JSON.stringify([{ attribute: "country", operator: "oneOf", value: "BR" }]),
      ),
    ).toThrow(/oneOf/);
  });

  it("accepts valid values for every segment operator", () => {
    const conditions = [
      { attribute: "role", operator: "equals", value: "admin" },
      { attribute: "role", operator: "notEquals", value: null },
      { attribute: "email", operator: "contains", value: "@example.com" },
      { attribute: "email", operator: "startsWith", value: "ana" },
      { attribute: "email", operator: "endsWith", value: "example.com" },
      { attribute: "country", operator: "oneOf", value: ["BR", "PT"] },
      { attribute: "roles", operator: "arrayContains", value: "admin" },
      { attribute: "age", operator: "greaterThan", value: 18 },
      { attribute: "age", operator: "lessThan", value: 65 },
      { attribute: "createdAt", operator: "dateBefore", value: "2026-05-16" },
      { attribute: "createdAt", operator: "dateAfter", value: 1_779_000_000_000 },
      { attribute: "appVersion", operator: "semverEquals", value: "1.2.3" },
      { attribute: "appVersion", operator: "semverGreaterThan", value: "1.2.3" },
      { attribute: "appVersion", operator: "semverGreaterThanOrEquals", value: "1.2.3" },
      { attribute: "appVersion", operator: "semverLessThan", value: "2.0.0" },
      { attribute: "appVersion", operator: "semverLessThanOrEquals", value: "2.0.0" },
    ];

    expect(parseSegmentConditions(JSON.stringify(conditions))).toEqual(conditions);
    expect(parseSegmentConditions("")).toEqual([]);
  });

  it("rejects invalid segment condition values", () => {
    const invalidConditions = [
      { condition: { attribute: "", operator: "equals", value: true }, message: /attribute/ },
      { condition: { attribute: "a".repeat(81), operator: "equals", value: true }, message: /80/ },
      { condition: { attribute: "country", operator: "equals" }, message: /precisa de value/ },
      { condition: { attribute: "payload", operator: "equals", value: {} }, message: /Comparacao/ },
      { condition: { attribute: "email", operator: "contains", value: 123 }, message: /contains/ },
      {
        condition: { attribute: "country", operator: "oneOf", value: ["BR", {}] },
        message: /oneOf/,
      },
      {
        condition: { attribute: "age", operator: "greaterThan", value: Number.NaN },
        message: /greaterThan/,
      },
      {
        condition: { attribute: "roles", operator: "arrayContains", value: {} },
        message: /arrayContains/,
      },
      {
        condition: { attribute: "createdAt", operator: "dateAfter", value: "bad-date" },
        message: /data/,
      },
      {
        condition: { attribute: "appVersion", operator: "semverEquals", value: "1.0" },
        message: /SemVer/,
      },
      {
        condition: { attribute: "country", operator: "equals", value: "BR", segment: "beta" },
        message: /referenciar outros segmentos/,
      },
      {
        condition: {
          attribute: "country",
          operator: "equals",
          value: "BR",
          prerequisiteFlag: "flag",
        },
        message: /prerequisite flags/,
      },
    ];

    for (const { condition, message } of invalidConditions) {
      expect(() => parseSegmentConditions(JSON.stringify([condition]))).toThrow(message);
    }
  });

  it("rejects excessive segment conditions", () => {
    expect(() =>
      parseSegmentConditions(
        JSON.stringify(
          Array.from({ length: 51 }, () => ({
            attribute: "country",
            operator: "equals",
            value: "BR",
          })),
        ),
      ),
    ).toThrow(/50/);
  });
});

describe("Segments integration", () => {
  it("loads, creates and updates segments", async () => {
    const fetchMock = mockDefaultApiRoutes();
    const user = userEvent.setup();

    renderRouteWithProviders(<SegmentsPage />, {
      path: segmentsRoutePath,
      route: segmentsRoute,
    });

    await waitFor(() => expect(screen.getByText("Beta users")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Criar segment" }));
    const dialog = await screen.findByRole("dialog", { name: "Criar segment" });
    await user.type(within(dialog).getByPlaceholderText("beta-users"), "internal-users");
    await user.type(within(dialog).getByPlaceholderText("Beta users"), "Internal users");
    await user.type(within(dialog).getByPlaceholderText("Descricao opcional"), "Usuarios internos");
    fireEvent.change(within(dialog).getByLabelText("Conditions JSON"), {
      target: {
        value: JSON.stringify([
          { attribute: "email", operator: "endsWith", value: "@example.com" },
        ]),
      },
    });
    await user.click(within(dialog).getByRole("button", { name: "Criar segmento" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Editar Beta users" })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "Editar Beta users" }));
    await user.click(screen.getByRole("button", { name: "Salvar segmento" }));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) =>
            String(url).includes("/configs/cfg_default/segments") && init?.method === "POST",
        ),
      ).toBe(true);
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) =>
            String(url).includes("/segments/segment_beta") && init?.method === "PATCH",
        ),
      ).toBe(true);
    });
  });

  it("shows segment query and create errors", async () => {
    mockDefaultApiRoutes([
      {
        path: /^\/configs\/[^/]+\/segments$/,
        payload: { message: "Segments failed" },
        status: 500,
      },
      {
        path: /^\/configs\/[^/]+\/segments$/,
        method: "POST",
        payload: { message: "Create segment failed" },
        status: 500,
      },
    ]);
    const user = userEvent.setup();

    renderRouteWithProviders(<SegmentsPanel isCreateOpen onCreateOpenChange={() => undefined} />, {
      path: segmentsRoutePath,
      route: segmentsRoute,
    });

    expect(await screen.findByText("Segments failed")).toBeInTheDocument();

    const dialog = await screen.findByRole("dialog", { name: "Criar segment" });
    await user.type(within(dialog).getByPlaceholderText("beta-users"), "internal-users");
    await user.type(within(dialog).getByPlaceholderText("Beta users"), "Internal users");
    await user.click(within(dialog).getByRole("button", { name: "Criar segmento" }));

    expect(await screen.findByText("Create segment failed")).toBeInTheDocument();
  });
});
