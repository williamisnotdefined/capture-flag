import { OrganizationEditPage } from "@pages/OrganizationsPage/OrganizationEditPage";
import { OrganizationMembersSection } from "@pages/OrganizationsPage/OrganizationMembersSection";
import { OrganizationPanel } from "@pages/OrganizationsPage/OrganizationPanel";
import { OrganizationsPage } from "@pages/OrganizationsPage/OrganizationsPage";
import {
  mockDefaultApiRoutes,
  organizationRoutePath,
  organizationsRoutePath,
} from "@src/test/pageApi";
import { renderRouteWithProviders } from "@src/test/render";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("Organizations pages", () => {
  it("lists, filters, creates and deletes organizations", async () => {
    const fetchMock = mockDefaultApiRoutes();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();

    renderRouteWithProviders(<OrganizationsPage />, {
      path: organizationsRoutePath,
      route: "/organizations",
    });

    expect(await screen.findByText("Acme Product")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Filtrar organizacoes"), "nova");
    expect(screen.queryByText("Acme Product")).not.toBeInTheDocument();
    expect(screen.getByText("Nova Labs")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Filtrar organizacoes"));
    await user.click(screen.getByRole("button", { name: "Nova organizacao" }));
    await user.type(await screen.findByLabelText("Organizacao"), "New Org");
    await user.click(screen.getByRole("button", { name: "Criar" }));

    await user.click(screen.getByRole("button", { name: "Acoes para Acme Product" }));
    await user.click(await screen.findByLabelText("Excluir Acme Product"));

    expect(confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) => String(url).endsWith("/organizations") && init?.method === "POST",
        ),
      ).toBe(true);
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) =>
            String(url).includes("/organizations/org_acme") && init?.method === "DELETE",
        ),
      ).toBe(true);
    });
  });

  it("shows organization list query and create errors", async () => {
    mockDefaultApiRoutes([
      { path: "/auth/me", payload: { message: "Me failed" }, status: 500 },
      {
        path: "/organizations",
        method: "POST",
        payload: { message: "Create failed" },
        status: 500,
      },
    ]);
    const user = userEvent.setup();

    renderRouteWithProviders(<OrganizationsPage />, {
      path: organizationsRoutePath,
      route: "/organizations",
    });

    expect(await screen.findByText("Me failed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Nova organizacao" }));
    await user.type(await screen.findByLabelText("Organizacao"), "New Org");
    await user.click(screen.getByRole("button", { name: "Criar" }));

    expect(await screen.findByText("Create failed")).toBeInTheDocument();
  });

  it("updates and deletes a selected organization", async () => {
    const fetchMock = mockDefaultApiRoutes();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();

    renderRouteWithProviders(<OrganizationPanel />, {
      path: organizationRoutePath,
      route: "/organizations/org_acme",
    });

    await user.click(await screen.findByRole("button", { name: "Editar Acme Product" }));
    await user.clear(screen.getByRole("textbox", { name: "Nome" }));
    await user.type(screen.getByRole("textbox", { name: "Nome" }), "Acme Updated");
    await user.click(screen.getByRole("button", { name: "Salvar nome" }));
    await user.click(screen.getByRole("button", { name: "Excluir organizacao" }));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) =>
            String(url).includes("/organizations/org_acme") && init?.method === "PATCH",
        ),
      ).toBe(true);
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) =>
            String(url).includes("/organizations/org_acme") && init?.method === "DELETE",
        ),
      ).toBe(true);
    });
  });

  it("does not render members section when organization is missing", async () => {
    mockDefaultApiRoutes();

    renderRouteWithProviders(<OrganizationEditPage />, {
      path: organizationRoutePath,
      route: "/organizations/missing_org",
    });

    expect(await screen.findByText("Organizacao nao encontrada.")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Membros da organizacao" }),
    ).not.toBeInTheDocument();
  });

  it("manages organization members and surfaces API errors", async () => {
    const fetchMock = mockDefaultApiRoutes([
      {
        path: /^\/organizations\/[^/]+\/members\/[^/]+$/,
        method: "DELETE",
        payload: { message: "Remove member failed" },
        status: 500,
      },
    ]);
    const user = userEvent.setup();

    renderRouteWithProviders(<OrganizationMembersSection />, {
      path: organizationRoutePath,
      route: "/organizations/org_acme",
    });

    expect(await screen.findByText("Ana Silva")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("email do usuario"), "new@example.com");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    await user.click(screen.getByRole("button", { name: "Acoes para Bruno Costa" }));
    await user.click(await screen.findByText("Remover"));

    expect(await screen.findByText("Remove member failed")).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(
        ([url, init]) =>
          String(url).includes("/organizations/org_acme/members") && init?.method === "POST",
      ),
    ).toBe(true);
  });
});
