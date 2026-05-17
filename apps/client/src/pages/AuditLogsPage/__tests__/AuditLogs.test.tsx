import { AuditLogsPage } from "@pages/AuditLogsPage/AuditLogsPage";
import { AuditLogsPanel } from "@pages/AuditLogsPage/AuditLogsPanel";
import { AuditLogsTable } from "@pages/AuditLogsPage/AuditLogsTable";
import {
  AuditTimeline,
  formatAuditAction,
  formatAuditActor,
} from "@pages/AuditLogsPage/AuditTimeline";
import { auditLogsRoutePath, mockDefaultApiRoutes } from "@src/test/pageApi";
import { renderRouteWithProviders, renderWithProviders } from "@src/test/render";
import { auditLogsRoute, storyAuditLogs } from "@stories/mockData";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

describe("AuditLogs display components", () => {
  it("formats actions and actors", () => {
    expect(formatAuditAction("feature_flag.update_value")).toBe("feature flag / update value");
    expect(formatAuditActor(storyAuditLogs[0])).toContain("Ana Silva");
    expect(formatAuditActor({ ...storyAuditLogs[0], actor: null })).toBe(
      "Usuario removido (user_ana)",
    );
    expect(formatAuditActor({ ...storyAuditLogs[0], actor: null, actorUserId: null })).toBe(
      "Sistema",
    );
  });

  it("renders timeline entries, details and states", () => {
    renderWithProviders(
      <AuditTimeline
        description="Eventos recentes"
        emptyMessage="Sem eventos"
        entries={storyAuditLogs}
        error={new Error("Falha ao carregar")}
        isFetching
        title="Timeline"
      />,
    );

    expect(screen.getByText("Timeline")).toBeInTheDocument();
    expect(screen.getByText("Eventos recentes")).toBeInTheDocument();
    expect(screen.getByText("Falha ao carregar")).toBeInTheDocument();
    expect(screen.getByText("feature flag / update value")).toBeInTheDocument();
    expect(screen.getByText("Atualizando audit logs...")).toBeInTheDocument();
    expect(screen.getByText("Old value")).toBeInTheDocument();
    expect(screen.getAllByText("Metadata").length).toBeGreaterThan(0);
  });

  it("renders empty timeline state", () => {
    renderWithProviders(
      <AuditTimeline
        emptyMessage="Sem eventos"
        entries={[]}
        error={null}
        isFetching={false}
        title="Timeline"
      />,
    );

    expect(screen.getByText("Sem eventos")).toBeInTheDocument();
  });

  it("renders timeline entries without additional details", () => {
    renderWithProviders(
      <AuditTimeline
        emptyMessage="Sem eventos"
        entries={[{ ...storyAuditLogs[0], metadata: null, newValue: null, oldValue: null }]}
        error={null}
        isFetching={false}
        title="Timeline"
      />,
    );

    expect(screen.queryByText("Old value")).not.toBeInTheDocument();
  });

  it("renders table rows, loading and details dialog", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AuditLogsTable emptyMessage="Sem audit logs" entries={storyAuditLogs} isFetching={false} />,
    );

    expect(screen.getByText("FeatureFlag")).toBeInTheDocument();
    expect(screen.getByText("flag_checkout")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Acoes para feature flag / update value" }),
    );
    await user.click(await screen.findByText("Ver detalhes"));

    expect(
      await screen.findByRole("dialog", { name: "feature flag / update value" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Old value")).toBeInTheDocument();
    expect(screen.getByText("New value")).toBeInTheDocument();
  });

  it("renders table loading and empty states", () => {
    const { rerender } = renderWithProviders(
      <AuditLogsTable emptyMessage="Sem audit logs" entries={[]} isFetching />,
    );

    expect(screen.getByText("Carregando audit logs...")).toBeInTheDocument();

    rerender(<AuditLogsTable emptyMessage="Sem audit logs" entries={[]} isFetching={false} />);

    expect(screen.getByText("Sem audit logs")).toBeInTheDocument();
  });

  it("shows no-details message in table dialog", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AuditLogsTable
        emptyMessage="Sem audit logs"
        entries={[{ ...storyAuditLogs[0], metadata: null, newValue: null, oldValue: null }]}
        isFetching={false}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Acoes para feature flag / update value" }),
    );
    await user.click(await screen.findByText("Ver detalhes"));

    expect(
      await screen.findByText("Este evento nao possui detalhes adicionais."),
    ).toBeInTheDocument();
  });
});

describe("AuditLogs integration", () => {
  it("loads audit logs successfully and applies filters", async () => {
    const fetchMock = mockDefaultApiRoutes();
    const user = userEvent.setup();

    renderRouteWithProviders(<AuditLogsPanel />, {
      path: auditLogsRoutePath,
      route: auditLogsRoute,
    });

    await waitFor(() =>
      expect(screen.getByText("feature flag / update value")).toBeInTheDocument(),
    );
    expect(screen.getByText("2 eventos carregados")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Filtrar por action"), "sdk_key.rotate");
    await screen.findByRole("option", { name: "Bruno Costa" });
    await user.selectOptions(screen.getByLabelText("Filtrar por actor"), "user_bruno");
    await screen.findByRole("option", { name: "Default" });
    await user.selectOptions(screen.getByLabelText("Filtrar por config"), "cfg_default");
    await user.type(screen.getByLabelText("Filtrar por entity type"), "SdkKey");
    await screen.findByRole("option", { name: "SdkKey sdk_prod" });
    await user.selectOptions(screen.getByLabelText("Filtrar por entidade"), "sdk_prod");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([url]) => {
          const requestUrl = String(url);

          return (
            requestUrl.includes("/organizations/org_acme/audit-logs?") &&
            requestUrl.includes("action=sdk_key.rotate") &&
            requestUrl.includes("actorUserId=user_bruno") &&
            requestUrl.includes("configId=cfg_default") &&
            requestUrl.includes("entityId=sdk_prod") &&
            requestUrl.includes("entityType=SdkKey")
          );
        }),
      ).toBe(true);
    });
  });

  it("shows query and validation errors", async () => {
    mockDefaultApiRoutes([
      {
        path: /^\/organizations\/[^/]+\/audit-logs$/,
        payload: { message: "Audit API failed" },
        status: 500,
      },
    ]);
    const user = userEvent.setup();

    renderRouteWithProviders(<AuditLogsPage />, {
      path: auditLogsRoutePath,
      route: auditLogsRoute,
    });

    expect(await screen.findByText("Audit API failed")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Filtrar a partir de"), "2026-05-16T12:00");
    await user.type(screen.getByLabelText("Filtrar ate"), "2026-05-15T12:00");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A data inicial precisa ser anterior a data final.",
    );
  });
});
