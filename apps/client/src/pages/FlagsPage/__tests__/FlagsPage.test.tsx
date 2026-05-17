import { FlagsPage } from "@pages/FlagsPage/FlagsPage";
import { FeatureFlagsPanel } from "@pages/FlagsPage/featureFlags/FeatureFlagsPanel";
import { flagsRoutePath, mockDefaultApiRoutes } from "@src/test/pageApi";
import { renderRouteWithProviders } from "@src/test/render";
import { flagsRoute, storyMe, storyOrganizations, storyProjects } from "@stories/mockData";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("Flags page integration", () => {
  it("loads, filters and mutates feature flags", async () => {
    const fetchMock = mockDefaultApiRoutes();
    const user = userEvent.setup();

    renderRouteWithProviders(<FlagsPage />, {
      path: flagsRoutePath,
      route: flagsRoute,
    });

    await waitFor(() => expect(screen.getByText("Novo checkout")).toBeInTheDocument());

    await user.type(screen.getByLabelText("Buscar flags"), "theme");
    await waitFor(() => expect(screen.queryByText("Novo checkout")).not.toBeInTheDocument());
    expect(screen.getByText("Tema do console")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Buscar flags"));

    await user.click(screen.getByRole("button", { name: "Criar flag" }));
    await user.type(await screen.findByLabelText(/Key do SDK/), "newFlag");
    await user.type(screen.getByLabelText(/Nome/), "New flag");
    await user.type(screen.getByLabelText("Tags"), "internal");
    const createButtons = screen.getAllByRole("button", { name: "Criar flag" });
    await user.click(createButtons[createButtons.length - 1]);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Editar Novo checkout" })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "Editar Novo checkout" }));
    await user.clear(screen.getByPlaceholderText("Nome da flag"));
    await user.type(screen.getByPlaceholderText("Nome da flag"), "Checkout renamed");
    await user.click(screen.getByRole("button", { name: "Salvar metadata" }));

    await user.click(screen.getByRole("button", { name: "Acoes para Novo checkout" }));
    await user.click(await screen.findByText("Apagar"));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) => String(url).includes("/feature-flags") && init?.method === "POST",
        ),
      ).toBe(true);
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) =>
            String(url).includes("/feature-flags/flag_checkout") && init?.method === "PATCH",
        ),
      ).toBe(true);
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) =>
            String(url).includes("/feature-flags/flag_checkout") && init?.method === "DELETE",
        ),
      ).toBe(true);
    });
  });

  it("shows feature flag query and create errors", async () => {
    mockDefaultApiRoutes([
      {
        path: /^\/configs\/[^/]+\/feature-flags$/,
        payload: { message: "Flags failed" },
        status: 500,
      },
      {
        path: /^\/configs\/[^/]+\/feature-flags$/,
        method: "POST",
        payload: { message: "Create flag failed" },
        status: 500,
      },
    ]);
    const user = userEvent.setup();

    renderRouteWithProviders(<FeatureFlagsPanel isCreateOpen onCreateOpenChange={vi.fn()} />, {
      path: flagsRoutePath,
      route: flagsRoute,
    });

    expect(await screen.findByText("Flags failed")).toBeInTheDocument();

    await user.type(await screen.findByLabelText(/Key do SDK/), "newFlag");
    await user.type(screen.getByLabelText(/Nome/), "New flag");
    await user.click(screen.getByRole("button", { name: "Criar flag" }));

    expect(await screen.findByText("Create flag failed")).toBeInTheDocument();
  });

  it("filters feature flags by type, tag and state", async () => {
    mockDefaultApiRoutes();
    const user = userEvent.setup();

    renderRouteWithProviders(
      <FeatureFlagsPanel isCreateOpen={false} onCreateOpenChange={vi.fn()} />,
      {
        path: flagsRoutePath,
        route: flagsRoute,
      },
    );

    await waitFor(() => expect(screen.getByText("Novo checkout")).toBeInTheDocument());

    await user.selectOptions(screen.getByLabelText("Filtrar por tipo"), "string");
    await waitFor(() => expect(screen.queryByText("Novo checkout")).not.toBeInTheDocument());
    expect(screen.getByText("Tema do console")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Filtrar por tipo"), "all");
    await user.selectOptions(screen.getByLabelText("Filtrar por tag"), "limits");
    await waitFor(() => expect(screen.getByText("Tenant limits")).toBeInTheDocument());
    expect(screen.queryByText("Tema do console")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Filtrar por tag"), "all");
    await user.selectOptions(screen.getByLabelText("Filtrar por estado"), "missing");
    await waitFor(() => expect(screen.getByText("Tenant limits")).toBeInTheDocument());
    expect(screen.queryByText("Novo checkout")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Filtrar por estado"), "rules");
    await waitFor(() => expect(screen.getByText("Novo checkout")).toBeInTheDocument());
    expect(screen.queryByText("Tenant limits")).not.toBeInTheDocument();
  });

  it("disables flag management without permission", async () => {
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
        payload: [{ ...storyProjects[0], currentUserProjectRole: "viewer" }],
      },
    ]);

    renderRouteWithProviders(<FeatureFlagsPanel isCreateOpen onCreateOpenChange={vi.fn()} />, {
      path: flagsRoutePath,
      route: flagsRoute,
    });

    expect(
      await screen.findByText(
        "Voce precisa ser developer, project_admin, owner ou admin para gerenciar flags.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Criar flag" })).toBeDisabled();
  });
});
