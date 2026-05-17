import { ConfigPreviewPanel } from "@pages/ConfigsPage/ConfigPreviewPanel";
import { ConfigsPage } from "@pages/ConfigsPage/ConfigsPage";
import { ConfigsPanel } from "@pages/ConfigsPage/ConfigsPanel";
import { configsRoutePath, mockDefaultApiRoutes } from "@src/test/pageApi";
import { renderRouteWithProviders } from "@src/test/render";
import { defaultProjectRoute, storyMe, storyOrganizations, storyProjects } from "@stories/mockData";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("Configs pages", () => {
  it("loads configs, preview and creates configs", async () => {
    const fetchMock = mockDefaultApiRoutes();
    const user = userEvent.setup();

    renderRouteWithProviders(<ConfigsPage />, {
      path: configsRoutePath,
      route: defaultProjectRoute,
    });

    await waitFor(() =>
      expect(screen.getByText("Runtime config consumida pelo SDK web.")).toBeInTheDocument(),
    );
    await waitFor(() => expect(screen.getByText(/newCheckout/)).toBeInTheDocument());
    expect(screen.getByText('ETag "cfg-default-prod-42"')).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Nova config" }));
    await user.type(await screen.findByLabelText("Nome"), "Runtime");
    await user.type(screen.getByLabelText("Descricao"), "Config de runtime");
    await user.click(screen.getByRole("button", { name: "Criar" }));

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).includes("/projects/project_console/configs") && init?.method === "POST",
      );

      expect(postCall).toBeDefined();
      expect(JSON.parse(String(postCall?.[1]?.body))).toEqual({
        description: "Config de runtime",
        name: "Runtime",
      });
    });
  });

  it("updates config description and surfaces mutation errors", async () => {
    const fetchMock = mockDefaultApiRoutes([
      {
        path: /^\/configs\/[^/]+$/,
        method: "PATCH",
        payload: { message: "Config update failed" },
        status: 500,
      },
    ]);
    const user = userEvent.setup();

    renderRouteWithProviders(<ConfigsPanel />, {
      path: configsRoutePath,
      route: defaultProjectRoute,
    });

    await user.clear(await screen.findByPlaceholderText("Ex.: Config consumida pelo SDK web."));
    await user.type(
      screen.getByPlaceholderText("Ex.: Config consumida pelo SDK web."),
      "Nova descricao",
    );
    await user.click(screen.getByRole("button", { name: "Salvar descricao" }));

    expect(await screen.findByText("Config update failed")).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(
        ([url, init]) => String(url).includes("/configs/cfg_default") && init?.method === "PATCH",
      ),
    ).toBe(true);
  });

  it("updates config descriptions", async () => {
    const fetchMock = mockDefaultApiRoutes();
    const user = userEvent.setup();
    renderRouteWithProviders(<ConfigsPanel />, {
      path: configsRoutePath,
      route: defaultProjectRoute,
    });

    await user.clear(await screen.findByPlaceholderText("Ex.: Config consumida pelo SDK web."));
    await user.type(
      screen.getByPlaceholderText("Ex.: Config consumida pelo SDK web."),
      "Descricao salva",
    );
    await user.click(screen.getByRole("button", { name: "Salvar descricao" }));

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) => String(url).includes("/configs/cfg_default") && init?.method === "PATCH",
        ),
      ).toBe(true),
    );
  });

  it("deletes configs from row and bulk actions", async () => {
    const fetchMock = mockDefaultApiRoutes();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    renderRouteWithProviders(<ConfigsPanel />, {
      path: configsRoutePath,
      route: defaultProjectRoute,
    });

    await waitFor(() => expect(screen.getByText("Checkout")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Acoes para Checkout" }));
    await user.click(await screen.findByLabelText("Excluir Checkout"));

    await user.click(screen.getByRole("checkbox", { name: "Selecionar Default" }));
    await user.click(screen.getByRole("button", { name: "Excluir" }));

    expect(confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) =>
            String(url).includes("/configs/cfg_checkout") && init?.method === "DELETE",
        ),
      ).toBe(true);
      const bulkDeleteCall = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).includes("/projects/project_console/configs/bulk-delete") &&
          init?.method === "POST",
      );
      expect(bulkDeleteCall).toBeDefined();
      expect(JSON.parse(String(bulkDeleteCall?.[1]?.body))).toEqual({ ids: ["cfg_default"] });
    });
  });

  it("disables config editing without permission", async () => {
    mockDefaultApiRoutes([
      {
        path: "/auth/me",
        payload: {
          ...storyMe,
          organizations: [{ ...storyOrganizations[0], role: "viewer" }],
        },
      },
      {
        path: /^\/organizations\/[^/]+\/projects$/,
        payload: [{ ...storyProjects[0], currentUserProjectRole: "developer" }],
      },
    ]);
    renderRouteWithProviders(<ConfigsPanel />, {
      path: configsRoutePath,
      route: defaultProjectRoute,
    });

    expect(
      await screen.findByText("Somente owner, admin ou project_admin pode editar configs."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar descricao" })).toBeDisabled();
  });

  it("surfaces config preview query errors", async () => {
    mockDefaultApiRoutes([
      {
        path: /^\/configs\/[^/]+\/environments\/[^/]+\/config-preview$/,
        payload: { message: "Preview failed" },
        status: 500,
      },
    ]);

    renderRouteWithProviders(<ConfigPreviewPanel />, {
      path: configsRoutePath,
      route: defaultProjectRoute,
    });

    expect(await screen.findByText("Preview failed")).toBeInTheDocument();
  });

  it("copies config preview JSON", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    mockDefaultApiRoutes();
    const user = userEvent.setup();
    renderRouteWithProviders(<ConfigPreviewPanel />, {
      path: configsRoutePath,
      route: defaultProjectRoute,
    });

    await screen.findByText('ETag "cfg-default-prod-42"');
    await user.click(screen.getByRole("button", { name: "Copiar JSON" }));

    expect(await screen.findByText("JSON copiado.")).toBeInTheDocument();
  });

  it("handles missing config preview selections", async () => {
    mockDefaultApiRoutes([
      { path: /^\/projects\/[^/]+\/configs$/, payload: [] },
      { path: /^\/projects\/[^/]+\/environments$/, payload: [] },
    ]);
    renderRouteWithProviders(<ConfigPreviewPanel />, {
      path: configsRoutePath,
      route: defaultProjectRoute,
    });

    expect(
      await screen.findByText("Selecione config e ambiente para visualizar o JSON."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copiar JSON" })).toBeDisabled();
  });
});
