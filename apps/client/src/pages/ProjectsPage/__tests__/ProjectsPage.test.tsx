import { ProjectMembersSection } from "@pages/ProjectsPage/ProjectMembersSection";
import { ProjectsPage } from "@pages/ProjectsPage/ProjectsPage";
import { ProjectPanel, ProjectsPanel } from "@pages/ProjectsPage/ProjectsPanel";
import { mockDefaultApiRoutes, projectRoutePath, projectsRoutePath } from "@src/test/pageApi";
import { renderRouteWithProviders } from "@src/test/render";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("Projects pages", () => {
  it("lists, filters and creates projects", async () => {
    const fetchMock = mockDefaultApiRoutes();
    const user = userEvent.setup();

    renderRouteWithProviders(<ProjectsPanel />, {
      path: projectsRoutePath,
      route: "/organizations/org_acme/projects",
    });

    expect(await screen.findByText("Console Web")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Filtrar projetos"), "mobile");
    expect(screen.queryByText("Console Web")).not.toBeInTheDocument();
    expect(screen.getByText("Mobile SDK")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Filtrar projetos"));
    await user.type(screen.getByPlaceholderText("Novo projeto"), "New Project");
    await user.click(screen.getByRole("button", { name: "Criar" }));

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).includes("/organizations/org_acme/projects") && init?.method === "POST",
      );

      expect(postCall).toBeDefined();
      expect(JSON.parse(String(postCall?.[1]?.body))).toEqual({ name: "New Project" });
    });
  });

  it("renders list and selected project routes", async () => {
    mockDefaultApiRoutes();
    renderRouteWithProviders(<ProjectsPage />, {
      path: projectsRoutePath,
      route: "/organizations/org_acme/projects",
    });

    expect(await screen.findByRole("heading", { name: "Projetos" })).toBeInTheDocument();

    renderRouteWithProviders(<ProjectsPage />, {
      path: projectRoutePath,
      route: "/organizations/org_acme/projects/project_console",
    });

    expect(await screen.findByRole("heading", { name: "Console Web" })).toBeInTheDocument();
  });

  it("updates and deletes selected projects", async () => {
    const fetchMock = mockDefaultApiRoutes();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();

    renderRouteWithProviders(<ProjectPanel />, {
      path: projectRoutePath,
      route: "/organizations/org_acme/projects/project_console",
    });

    await user.click(await screen.findByRole("button", { name: "Editar Console Web" }));
    await user.clear(screen.getByRole("textbox", { name: "Nome" }));
    await user.type(screen.getByRole("textbox", { name: "Nome" }), "Console Updated");
    await user.click(screen.getByRole("button", { name: "Salvar nome" }));
    await user.click(screen.getByRole("button", { name: "Excluir projeto" }));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) =>
            String(url).includes("/projects/project_console") && init?.method === "PATCH",
        ),
      ).toBe(true);
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) =>
            String(url).includes("/projects/project_console") && init?.method === "DELETE",
        ),
      ).toBe(true);
    });
  });

  it("manages project members and excludes existing organization members", async () => {
    const fetchMock = mockDefaultApiRoutes();
    const user = userEvent.setup();

    renderRouteWithProviders(<ProjectMembersSection />, {
      path: projectRoutePath,
      route: "/organizations/org_acme/projects/project_console",
    });

    expect(await screen.findByText("Ana Silva")).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Ana Silva/ })).not.toBeInTheDocument();

    await user.selectOptions(screen.getAllByRole("combobox")[0], "user_carla");
    await user.selectOptions(screen.getAllByRole("combobox")[1], "viewer");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).includes("/projects/project_console/members") && init?.method === "POST",
      );

      expect(postCall).toBeDefined();
      expect(JSON.parse(String(postCall?.[1]?.body))).toEqual({
        role: "viewer",
        userId: "user_carla",
      });
    });
  });

  it("shows project query and member errors", async () => {
    mockDefaultApiRoutes([
      {
        path: /^\/organizations\/[^/]+\/projects$/,
        payload: { message: "Projects failed" },
        status: 500,
      },
      {
        path: /^\/projects\/[^/]+\/members$/,
        payload: { message: "Project members failed" },
        status: 500,
      },
    ]);

    renderRouteWithProviders(<ProjectsPanel />, {
      path: projectsRoutePath,
      route: "/organizations/org_acme/projects",
    });

    expect(await screen.findByText("Projects failed")).toBeInTheDocument();

    renderRouteWithProviders(<ProjectMembersSection />, {
      path: projectRoutePath,
      route: "/organizations/org_acme/projects/project_console",
    });

    expect(await screen.findByText("Project members failed")).toBeInTheDocument();
  });
});
