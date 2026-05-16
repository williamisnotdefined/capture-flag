import { apiV1BaseUrl } from "@api/client";
import { LoginPage } from "@pages/LoginPage";
import { renderWithProviders } from "@src/test/render";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("LoginPage", () => {
  it("renders the GitHub OAuth entrypoint", () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByRole("heading", { name: "Capture Flag" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Fundacao da plataforma" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Entrar com GitHub" })).toHaveAttribute(
      "href",
      `${apiV1BaseUrl}/auth/github/start`,
    );
  });
});
