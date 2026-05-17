import { AccountPage } from "@pages/AccountPage";
import { accountRoutePath, mockDefaultApiRoutes } from "@src/test/pageApi";
import { renderRouteWithProviders } from "@src/test/render";
import { screen, waitFor } from "@testing-library/react";
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
});
