import { publicApiV1BaseUrl } from "@api/client";
import { CreatedSdkKeyNotice } from "@pages/SdkKeysPage/CreatedSdkKeyNotice";
import { SdkKeyList } from "@pages/SdkKeysPage/SdkKeyList";
import { SdkKeysPage } from "@pages/SdkKeysPage/SdkKeysPage";
import { SdkKeysSection } from "@pages/SdkKeysPage/SdkKeysSection";
import { mockDefaultApiRoutes, sdkKeysRoutePath } from "@src/test/pageApi";
import { renderRouteWithProviders, renderWithProviders } from "@src/test/render";
import { sdkKeysRoute, storySdkKeys } from "@stories/mockData";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("SDK key page components", () => {
  it("renders created SDK key notice and invokes copy", async () => {
    const onCopyPublicConfigUrl = vi.fn();
    const onCopySdkKey = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <CreatedSdkKeyNotice
        onCopyPublicConfigUrl={onCopyPublicConfigUrl}
        onCopySdkKey={onCopySdkKey}
        publicConfigUrl="https://api.example.com/public"
        publicConfigUrlCopyMessage="URL copiada."
        sdkKey="cf_test_full_key"
        sdkKeyCopyMessage="Chave copiada."
      />,
    );

    expect(screen.getByText("cf_test_full_key")).toBeInTheDocument();
    expect(screen.getByText("https://api.example.com/public")).toBeInTheDocument();
    expect(screen.getByText("Chave copiada.")).toBeInTheDocument();
    expect(screen.getByText("URL copiada.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Copiar chave" }));
    await user.click(screen.getByRole("button", { name: "Copiar URL" }));

    expect(onCopySdkKey).toHaveBeenCalledOnce();
    expect(onCopyPublicConfigUrl).toHaveBeenCalledOnce();
  });

  it("filters SDK keys and calls rotate/revoke callbacks", async () => {
    const onBulkRevoke = vi.fn();
    const onRotate = vi.fn();
    const onRevoke = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <SdkKeyList
        canManageProjectResources
        isFetching
        isMutating={false}
        onBulkRevoke={onBulkRevoke}
        onRevoke={onRevoke}
        onRotate={onRotate}
        sdkKeys={storySdkKeys}
      />,
    );

    expect(screen.getByText("Production web")).toBeInTheDocument();
    expect(screen.getByText("Atualizando SDK keys...")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Filtrar SDK keys por status"), "revoked");

    expect(screen.queryByText("Production web")).not.toBeInTheDocument();
    expect(screen.getAllByText("Staging").length).toBeGreaterThan(0);

    await user.selectOptions(screen.getByLabelText("Filtrar SDK keys por status"), "active");
    await user.type(screen.getByLabelText("Filtrar SDK keys"), "prod");
    await user.click(screen.getByRole("button", { name: "Acoes para Production web" }));
    await user.click(await screen.findByText("Rotacionar"));

    expect(onRotate).toHaveBeenCalledWith("sdk_prod");

    await user.click(screen.getByRole("button", { name: "Acoes para Production web" }));
    await user.click(await screen.findByText("Revogar"));

    expect(onRevoke).toHaveBeenCalledWith("sdk_prod");

    await user.click(screen.getByRole("checkbox", { name: "Selecionar Production web" }));
    await user.click(screen.getByRole("button", { name: "Revogar" }));

    expect(onBulkRevoke).toHaveBeenCalledWith(["sdk_prod"]);
  });

  it("renders empty SDK key list state", () => {
    renderWithProviders(
      <SdkKeyList
        canManageProjectResources={false}
        isFetching={false}
        isMutating={false}
        onBulkRevoke={vi.fn()}
        onRevoke={vi.fn()}
        onRotate={vi.fn()}
        sdkKeys={[]}
      />,
    );

    expect(screen.getByText("Sem SDK keys.")).toBeInTheDocument();
  });
});

describe("SDK key page integration", () => {
  it("loads SDK keys and creates a key with a visible one-time secret", async () => {
    const fetchMock = mockDefaultApiRoutes();
    const user = userEvent.setup();

    renderRouteWithProviders(<SdkKeysPage />, {
      path: sdkKeysRoutePath,
      route: sdkKeysRoute,
    });

    await waitFor(() => expect(screen.getByText("Production web")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Gerar key" }));
    await user.type(await screen.findByPlaceholderText("Nome da SDK key"), "Browser SDK");
    await user.click(screen.getByRole("button", { name: "Gerar key" }));

    expect(await screen.findByText("cf_prod_full_test_key")).toBeInTheDocument();
    expect(
      screen.getByText(`${publicApiV1BaseUrl}/sdk/cf_prod_full_test_key/config`),
    ).toBeInTheDocument();

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).includes("/projects/project_console/sdk-keys") && init?.method === "POST",
      );

      expect(postCall).toBeDefined();
      expect(JSON.parse(String(postCall?.[1]?.body))).toEqual({
        configId: "cfg_default",
        environmentId: "env_prod",
        name: "Browser SDK",
      });
    });
  });

  it("shows SDK key query errors", async () => {
    mockDefaultApiRoutes([
      {
        path: /^\/projects\/[^/]+\/sdk-keys$/,
        payload: { message: "SDK keys failed" },
        status: 500,
      },
    ]);

    renderRouteWithProviders(<SdkKeysSection isCreateOpen={false} onCreateOpenChange={vi.fn()} />, {
      path: sdkKeysRoutePath,
      route: sdkKeysRoute,
    });

    expect(await screen.findByText("SDK keys failed")).toBeInTheDocument();
  });

  it("shows SDK key mutation errors", async () => {
    mockDefaultApiRoutes([
      {
        path: /^\/projects\/[^/]+\/sdk-keys$/,
        payload: { message: "Create SDK key failed" },
        status: 500,
        method: "POST",
      },
    ]);
    const user = userEvent.setup();

    renderRouteWithProviders(<SdkKeysSection isCreateOpen onCreateOpenChange={vi.fn()} />, {
      path: sdkKeysRoutePath,
      route: sdkKeysRoute,
    });

    await user.type(await screen.findByPlaceholderText("Nome da SDK key"), "Browser SDK");
    await user.click(screen.getByRole("button", { name: "Gerar key" }));

    expect(await screen.findByText("Create SDK key failed")).toBeInTheDocument();
  });
});
