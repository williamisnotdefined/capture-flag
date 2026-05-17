import { AccountPage } from "@pages/AccountPage";
import { accountRoutePath, mockDefaultApiRoutes } from "@src/test/pageApi";
import { renderRouteWithProviders } from "@src/test/render";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

describe("AccountPage", () => {
  it("shows current account data and updates the display name", async () => {
    const fetchMock = mockDefaultApiRoutes();
    const user = userEvent.setup();

    renderRouteWithProviders(<AccountPage />, {
      path: accountRoutePath,
      route: "/account",
    });

    const nameInput = await screen.findByLabelText("Nome");
    expect(nameInput).toHaveValue("Ana Silva");
    expect(screen.getByLabelText("Email")).toHaveValue("ana@example.com");

    await user.clear(nameInput);
    await user.type(nameInput, "Ana Atualizada");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([url, init]) => {
          if (!String(url).endsWith("/auth/me") || init?.method !== "PATCH") {
            return false;
          }

          return JSON.parse(String(init.body)).name === "Ana Atualizada";
        }),
      ).toBe(true);
    });
  });

  it("requires explicit confirmation before deleting the account", async () => {
    const fetchMock = mockDefaultApiRoutes();
    const user = userEvent.setup();

    renderRouteWithProviders(<AccountPage />, {
      path: accountRoutePath,
      route: "/account",
    });

    await user.click(await screen.findByRole("button", { name: "Excluir conta" }));

    const dialog = await screen.findByRole("dialog", { name: "Excluir conta" });
    const deleteButton = within(dialog).getByRole("button", { name: "Excluir conta" });
    expect(deleteButton).toBeDisabled();

    const confirmationInput = within(dialog).getByLabelText("Digite EXCLUIR para confirmar");
    await user.type(confirmationInput, "excluir");
    expect(deleteButton).toBeDisabled();

    await user.clear(confirmationInput);
    await user.type(confirmationInput, "EXCLUIR");
    expect(deleteButton).toBeEnabled();
    await user.click(deleteButton);

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) => String(url).endsWith("/auth/me") && init?.method === "DELETE",
        ),
      ).toBe(true);
    });
  });

  it("shows delete account API errors", async () => {
    mockDefaultApiRoutes([
      {
        method: "DELETE",
        path: "/auth/me",
        payload: { message: "Organization must keep at least one owner" },
        status: 400,
      },
    ]);
    const user = userEvent.setup();

    renderRouteWithProviders(<AccountPage />, {
      path: accountRoutePath,
      route: "/account",
    });

    await user.click(await screen.findByRole("button", { name: "Excluir conta" }));

    const dialog = await screen.findByRole("dialog", { name: "Excluir conta" });
    await user.type(within(dialog).getByLabelText("Digite EXCLUIR para confirmar"), "EXCLUIR");
    await user.click(within(dialog).getByRole("button", { name: "Excluir conta" }));

    expect(await screen.findByText("Organization must keep at least one owner")).toBeVisible();
  });
});
