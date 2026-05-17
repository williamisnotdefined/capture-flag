import { EnvironmentsPage } from "@pages/EnvironmentsPage/EnvironmentsPage";
import { EnvironmentsPanel } from "@pages/EnvironmentsPage/EnvironmentsPanel";
import { environmentsRoutePath, mockDefaultApiRoutes } from "@src/test/pageApi";
import { renderRouteWithProviders } from "@src/test/render";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

const environmentsRoute =
  "/organizations/org_acme/projects/project_console/environments?environmentId=env_prod";

describe("Environments pages", () => {
  it("loads and creates environments", async () => {
    const fetchMock = mockDefaultApiRoutes();
    const user = userEvent.setup();

    renderRouteWithProviders(<EnvironmentsPage />, {
      path: environmentsRoutePath,
      route: environmentsRoute,
    });

    await waitFor(() => expect(screen.getByText("Production")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Novo environment" }));
    await user.type(await screen.findByPlaceholderText("production"), "QA");
    await user.click(screen.getByRole("button", { name: "Criar" }));

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).includes("/projects/project_console/environments") && init?.method === "POST",
      );

      expect(postCall).toBeDefined();
      expect(JSON.parse(String(postCall?.[1]?.body))).toEqual({ name: "QA" });
    });
  });

  it("renames environments and shows mutation errors", async () => {
    mockDefaultApiRoutes([
      {
        path: /^\/environments\/[^/]+$/,
        method: "PATCH",
        payload: { message: "Environment update failed" },
        status: 500,
      },
    ]);
    const user = userEvent.setup();

    renderRouteWithProviders(<EnvironmentsPanel />, {
      path: environmentsRoutePath,
      route: environmentsRoute,
    });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Editar Production" })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "Editar Production" }));
    await user.clear(screen.getByRole("textbox", { name: "Nome" }));
    await user.type(screen.getByRole("textbox", { name: "Nome" }), "Prod renamed");
    await user.click(screen.getByRole("button", { name: "Salvar nome" }));

    expect(await screen.findByText("Environment update failed")).toBeInTheDocument();
  });

  it("shows environment query errors", async () => {
    mockDefaultApiRoutes([
      {
        path: /^\/projects\/[^/]+\/environments$/,
        payload: { message: "Environments failed" },
        status: 500,
      },
    ]);

    renderRouteWithProviders(<EnvironmentsPanel />, {
      path: environmentsRoutePath,
      route: environmentsRoute,
    });

    expect(await screen.findByText("Environments failed")).toBeInTheDocument();
  });
});
