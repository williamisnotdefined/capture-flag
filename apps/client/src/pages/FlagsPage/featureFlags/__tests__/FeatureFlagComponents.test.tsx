import { CreateFeatureFlagForm } from "@pages/FlagsPage/featureFlags/CreateFeatureFlagForm";
import { FeatureFlagList } from "@pages/FlagsPage/featureFlags/FeatureFlagList";
import { FeatureFlagMetadataForm } from "@pages/FlagsPage/featureFlags/FeatureFlagMetadataForm";
import { FeatureFlagValueForm } from "@pages/FlagsPage/featureFlags/FeatureFlagValueForm";
import { renderWithProviders } from "@src/test/render";
import {
  storyBooleanFlagValue,
  storyFeatureFlags,
  storyOrganizationMembers,
  storySegments,
  storyStringFlagValue,
} from "@stories/mockData";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const ownerOptions = storyOrganizationMembers.map((member) => ({
  description: member.user.email ?? undefined,
  label: member.user.name,
  value: member.user.id,
}));

const ownerOptionWithoutDescription = [{ label: "No Email", value: "user_no_email" }];

describe("feature flag forms", () => {
  it("validates and submits create form values", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const user = userEvent.setup();

    renderWithProviders(
      <CreateFeatureFlagForm
        canCreateFlag
        isPending={false}
        onSubmit={onSubmit}
        ownerOptions={[...ownerOptions, ...ownerOptionWithoutDescription]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Criar flag" }));

    expect(await screen.findByText("Informe uma key.")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Key do SDK/), "newCheckout");
    await user.type(screen.getByLabelText(/Nome/), "Novo checkout");
    await user.selectOptions(screen.getByLabelText(/Tipo/), "string");
    await user.type(screen.getByLabelText("Descricao"), "Descricao");
    await user.selectOptions(screen.getByLabelText("Owner"), storyOrganizationMembers[0].user.id);
    await user.type(screen.getByLabelText("Tags"), "checkout, beta");
    await user.type(screen.getByLabelText("Hint para uso no SDK"), "Fallback seguro");
    await user.click(screen.getByRole("button", { name: "Criar flag" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        description: "Descricao",
        hint: "Fallback seguro",
        key: "newCheckout",
        name: "Novo checkout",
        ownerUserId: storyOrganizationMembers[0].user.id,
        tags: "checkout, beta",
        type: "string",
      }),
    );
  });

  it("shows create form validation and disabled states", async () => {
    const onSubmit = vi.fn(async () => {
      throw new Error("failed");
    });
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(
      <CreateFeatureFlagForm
        canCreateFlag={false}
        isPending={false}
        onSubmit={onSubmit}
        ownerOptions={ownerOptionWithoutDescription}
      />,
    );

    expect(screen.getByRole("button", { name: "Criar flag" })).toBeDisabled();
    expect(screen.getByRole("option", { name: "No Email" })).toBeInTheDocument();

    rerender(
      <CreateFeatureFlagForm
        canCreateFlag
        isPending
        onSubmit={onSubmit}
        ownerOptions={ownerOptionWithoutDescription}
      />,
    );
    expect(screen.getByRole("button", { name: "Criando..." })).toBeDisabled();

    rerender(
      <CreateFeatureFlagForm
        canCreateFlag
        isPending={false}
        onSubmit={onSubmit}
        ownerOptions={ownerOptionWithoutDescription}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Key do SDK/), { target: { value: "1bad" } });
    fireEvent.change(screen.getByLabelText(/Nome/), { target: { value: "Rejected flag" } });
    fireEvent.change(screen.getByLabelText("Descricao"), { target: { value: "d".repeat(501) } });
    fireEvent.change(screen.getByLabelText("Tags"), {
      target: { value: Array.from({ length: 21 }, (_, index) => `tag${index}`).join(",") },
    });
    fireEvent.change(screen.getByLabelText("Hint para uso no SDK"), {
      target: { value: "h".repeat(501) },
    });
    await user.click(screen.getByRole("button", { name: "Criar flag" }));

    expect(await screen.findByText(/Comece com letra/)).toBeInTheDocument();
    expect(screen.getAllByText("Use ate 500 caracteres.")).toHaveLength(2);
    expect(screen.getByText("Use no maximo 20 tags.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Key do SDK/), { target: { value: "rejectedFlag" } });
    fireEvent.change(screen.getByLabelText("Descricao"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Tags"), { target: { value: "a".repeat(51) } });
    fireEvent.change(screen.getByLabelText("Hint para uso no SDK"), { target: { value: "" } });
    await user.click(screen.getByRole("button", { name: "Criar flag" }));

    expect(await screen.findByText("Cada tag deve ter ate 50 caracteres.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Tags"), { target: { value: "" } });
    await user.click(screen.getByRole("button", { name: "Criar flag" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(screen.getByLabelText(/Key do SDK/)).toHaveValue("rejectedFlag");
  });

  it("keeps current owner option and submits metadata changes", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const user = userEvent.setup();
    const flag = {
      ...storyFeatureFlags[0],
      ownerUserId: "missing_user",
      owner: { avatarUrl: null, email: "missing@example.com", id: "missing_user", name: "Missing" },
    };

    renderWithProviders(
      <FeatureFlagMetadataForm
        canEditMetadata
        flag={flag}
        isPending={false}
        onSubmit={onSubmit}
        ownerOptions={[]}
      />,
    );

    expect(
      screen.getByRole("option", { name: "Missing - missing@example.com" }),
    ).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Nome da flag"));
    await user.type(screen.getByPlaceholderText("Nome da flag"), "Checkout updated");
    await user.click(screen.getByRole("button", { name: "Salvar metadata" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: "Checkout updated" })),
    );
  });

  it("validates metadata fields and handles fallback owner labels", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const user = userEvent.setup();
    const flag = {
      ...storyFeatureFlags[0],
      owner: null,
      ownerUserId: "missing_owner",
    };

    renderWithProviders(
      <FeatureFlagMetadataForm
        canEditMetadata
        flag={flag}
        isPending={false}
        onSubmit={onSubmit}
        ownerOptions={[]}
      />,
    );

    expect(screen.getByRole("option", { name: "Owner atual - owner atual" })).toBeInTheDocument();
    await user.clear(screen.getByPlaceholderText("key"));
    await user.type(screen.getByPlaceholderText("key"), "1bad");
    await user.clear(screen.getByPlaceholderText("Nome da flag"));
    await user.type(screen.getByPlaceholderText("Descricao opcional"), "d".repeat(501));
    await user.type(screen.getByPlaceholderText("tags separadas por virgula"), "a".repeat(51));
    await user.type(screen.getByPlaceholderText("Hint opcional"), "h".repeat(501));
    await user.click(screen.getByRole("button", { name: "Salvar metadata" }));

    expect(await screen.findByText(/Comece com letra/)).toBeInTheDocument();
    expect(screen.getByText("Informe um nome.")).toBeInTheDocument();
    expect(screen.getAllByText("Use ate 500 caracteres.")).toHaveLength(2);
    expect(screen.getByText("Cada tag deve ter ate 50 caracteres.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("disables metadata edits without permission or while pending", () => {
    const { rerender } = renderWithProviders(
      <FeatureFlagMetadataForm
        canEditMetadata={false}
        flag={storyFeatureFlags[2]}
        isPending={false}
        onSubmit={vi.fn()}
        ownerOptions={ownerOptions}
      />,
    );

    expect(screen.getByRole("button", { name: "Salvar metadata" })).toBeDisabled();

    rerender(
      <FeatureFlagMetadataForm
        canEditMetadata
        flag={storyFeatureFlags[2]}
        isPending
        onSubmit={vi.fn()}
        ownerOptions={ownerOptions}
      />,
    );
    expect(screen.getByRole("button", { name: "Salvando..." })).toBeDisabled();
  });

  it("keeps metadata form values when submit rejects", async () => {
    const onSubmit = vi.fn(async () => {
      throw new Error("failed");
    });
    const user = userEvent.setup();

    renderWithProviders(
      <FeatureFlagMetadataForm
        canEditMetadata
        flag={storyFeatureFlags[0]}
        isPending={false}
        onSubmit={onSubmit}
        ownerOptions={ownerOptions}
      />,
    );

    await user.clear(screen.getByPlaceholderText("Nome da flag"));
    await user.type(screen.getByPlaceholderText("Nome da flag"), "Rejected name");
    await user.click(screen.getByRole("button", { name: "Salvar metadata" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(screen.getByPlaceholderText("Nome da flag")).toHaveValue("Rejected name");
  });

  it("submits parsed flag value form data and shows parse errors", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const user = userEvent.setup();

    renderWithProviders(
      <FeatureFlagValueForm
        canEditValue
        environmentId="env_prod"
        environmentName="Production"
        flag={storyFeatureFlags[0]}
        flags={storyFeatureFlags}
        isPending={false}
        mutationError={new Error("Valor recusado")}
        onSubmit={onSubmit}
        segments={storySegments}
        value={storyBooleanFlagValue}
      />,
    );

    expect(screen.getByText("Valor recusado")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Rules JSON"));
    await user.type(screen.getByLabelText("Rules JSON"), "not-json");
    await user.click(screen.getByRole("button", { name: "Salvar valor" }));

    expect(await screen.findByText("Rules deve ser um JSON valido.")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Rules JSON"));
    fireEvent.change(screen.getByLabelText("Rules JSON"), { target: { value: "[]" } });
    await user.selectOptions(screen.getByRole("combobox"), "false");
    await user.click(screen.getByRole("button", { name: "Salvar valor" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        defaultValue: false,
        percentageAttribute: "identifier",
        percentageOptionsJson: storyBooleanFlagValue.percentageOptionsJson,
        rulesJson: [],
      }),
    );
  });

  it("renders and submits string, integer and JSON flag value inputs", async () => {
    const user = userEvent.setup();
    const stringSubmit = vi.fn(async () => undefined);
    const { rerender } = renderWithProviders(
      <FeatureFlagValueForm
        canEditValue
        environmentId="env_prod"
        flag={storyFeatureFlags[1]}
        flags={[]}
        isPending={false}
        mutationError={null}
        onSubmit={stringSubmit}
        segments={[]}
        value={storyStringFlagValue}
      />,
    );

    expect(screen.getByText("Segmentos disponiveis: nenhum.")).toBeInTheDocument();
    expect(screen.getByText("Flags disponiveis: nenhuma.")).toBeInTheDocument();
    const stringInput = screen.getByDisplayValue("compact");
    await user.clear(stringInput);
    await user.type(stringInput, "expanded");
    await user.click(screen.getByRole("button", { name: "Salvar valor" }));
    await waitFor(() =>
      expect(stringSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ defaultValue: "expanded" }),
      ),
    );

    const integerSubmit = vi.fn(async () => undefined);
    rerender(
      <FeatureFlagValueForm
        canEditValue
        environmentId="env_prod"
        flag={{ ...storyFeatureFlags[1], initialDefaultValue: 1, type: "integer" }}
        flags={[]}
        isPending={false}
        mutationError={null}
        onSubmit={integerSubmit}
        segments={[]}
        value={undefined}
      />,
    );
    const integerInput = screen.getByDisplayValue("1");
    await user.clear(integerInput);
    await user.type(integerInput, "2");
    await user.click(screen.getByRole("button", { name: "Salvar valor" }));
    await waitFor(() =>
      expect(integerSubmit).toHaveBeenCalledWith(expect.objectContaining({ defaultValue: 2 })),
    );

    const jsonSubmit = vi.fn(async () => undefined);
    rerender(
      <FeatureFlagValueForm
        canEditValue
        environmentId="env_prod"
        flag={storyFeatureFlags[2]}
        flags={[]}
        isPending={false}
        mutationError={null}
        onSubmit={jsonSubmit}
        segments={[]}
        value={undefined}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("{}"), {
      target: { value: '{"maxProjects":10}' },
    });
    await user.click(screen.getByRole("button", { name: "Salvar valor" }));
    await waitFor(() =>
      expect(jsonSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ defaultValue: { maxProjects: 10 } }),
      ),
    );
  });

  it("keeps value form state when submit rejects", async () => {
    const onSubmit = vi.fn(async () => {
      throw new Error("failed");
    });
    const user = userEvent.setup();

    renderWithProviders(
      <FeatureFlagValueForm
        canEditValue
        environmentId="env_prod"
        flag={storyFeatureFlags[0]}
        flags={storyFeatureFlags}
        isPending={false}
        mutationError={null}
        onSubmit={onSubmit}
        segments={storySegments}
        value={{ ...storyBooleanFlagValue, percentageOptionsJson: [] }}
      />,
    );

    await user.selectOptions(screen.getByRole("combobox"), "false");
    fireEvent.change(screen.getByLabelText("Rules JSON"), { target: { value: "[]" } });
    await user.click(screen.getByRole("button", { name: "Salvar valor" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(screen.getByRole("combobox")).toHaveValue("false");
  });

  it("shows value parsing errors for defaults, attributes and rollout options", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(
      <FeatureFlagValueForm
        canEditValue
        environmentId="env_prod"
        flag={{ ...storyFeatureFlags[1], initialDefaultValue: 1, type: "integer" }}
        flags={[]}
        isPending={false}
        mutationError={null}
        onSubmit={onSubmit}
        segments={[]}
        value={undefined}
      />,
    );

    await user.clear(screen.getByDisplayValue("1"));
    await user.type(screen.getByPlaceholderText("0"), "3.14");
    await user.click(screen.getByRole("button", { name: "Salvar valor" }));
    expect(await screen.findByText("Informe um numero inteiro.")).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("0"));
    await user.type(screen.getByPlaceholderText("0"), "2");
    await user.clear(screen.getByLabelText("Atributo de rollout"));
    await user.click(screen.getByRole("button", { name: "Salvar valor" }));
    expect(await screen.findByText("Informe um atributo.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Atributo de rollout"), "identifier");
    fireEvent.change(screen.getByLabelText("Rollout percentual JSON"), {
      target: { value: "bad" },
    });
    await user.click(screen.getByRole("button", { name: "Salvar valor" }));
    expect(
      await screen.findByText("Rollout percentual deve ser um JSON valido."),
    ).toBeInTheDocument();

    rerender(
      <FeatureFlagValueForm
        canEditValue
        environmentId="env_prod"
        flag={storyFeatureFlags[2]}
        flags={[]}
        isPending={false}
        mutationError={null}
        onSubmit={onSubmit}
        segments={[]}
        value={undefined}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("{}"), { target: { value: "[]" } });
    await user.click(screen.getByRole("button", { name: "Salvar valor" }));
    expect(await screen.findByText("O valor deve ser um objeto JSON.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("renders value form pending state", () => {
    renderWithProviders(
      <FeatureFlagValueForm
        canEditValue
        environmentId="env_prod"
        flag={storyFeatureFlags[0]}
        flags={storyFeatureFlags}
        isPending
        mutationError={null}
        onSubmit={vi.fn()}
        segments={storySegments}
        value={storyBooleanFlagValue}
      />,
    );

    expect(screen.getByRole("button", { name: "Salvando..." })).toBeDisabled();
  });

  it("disables value form when no environment is selected", () => {
    renderWithProviders(
      <FeatureFlagValueForm
        canEditValue={false}
        environmentId=""
        flag={storyFeatureFlags[0]}
        flags={storyFeatureFlags}
        isPending={false}
        mutationError={null}
        onSubmit={vi.fn()}
        segments={[]}
        value={undefined}
      />,
    );

    expect(screen.getByText("Selecione um ambiente para editar o valor.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar valor" })).toBeDisabled();
  });
});

describe("FeatureFlagList", () => {
  it("selects, deletes and renders operational state", async () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <FeatureFlagList
        canManageFeatureFlags
        environmentId="env_prod"
        flags={storyFeatureFlags}
        isDeleting={false}
        isFetching
        onDelete={onDelete}
        onSelect={onSelect}
        selectedFeatureFlagId="flag_checkout"
      />,
    );

    expect(screen.getByText("Novo checkout")).toBeInTheDocument();
    expect(screen.getByText("Atualizando flags...")).toBeInTheDocument();
    expect(screen.getByText("rules")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Editar Tema do console" }));
    expect(onSelect).toHaveBeenCalledWith("flag_theme");

    await user.click(screen.getByRole("button", { name: "Acoes para Novo checkout" }));
    await user.click(await screen.findByText("Apagar"));

    expect(onDelete).toHaveBeenCalledWith("flag_checkout");
  });

  it("renders empty state and disabled destructive actions", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(
      <FeatureFlagList
        canManageFeatureFlags={false}
        environmentId=""
        flags={storyFeatureFlags.slice(0, 1)}
        isDeleting
        isFetching={false}
        onDelete={onDelete}
        onSelect={vi.fn()}
        selectedFeatureFlagId=""
      />,
    );

    await user.click(screen.getByRole("button", { name: "Acoes para Novo checkout" }));
    expect(await screen.findByText("Apagar")).toHaveAttribute("data-disabled");

    rerender(
      <FeatureFlagList
        canManageFeatureFlags
        environmentId="env_prod"
        flags={[]}
        isDeleting={false}
        isFetching={false}
        onDelete={onDelete}
        onSelect={vi.fn()}
        selectedFeatureFlagId=""
      />,
    );

    expect(screen.getByText("Nenhuma flag encontrada nesta config.")).toBeInTheDocument();
  });

  it("renders default, rollout and missing operational states", () => {
    renderWithProviders(
      <FeatureFlagList
        canManageFeatureFlags
        environmentId="env_prod"
        flags={[
          {
            ...storyFeatureFlags[0],
            id: "flag_rollout",
            key: "rolloutFlag",
            name: "Rollout flag",
            environmentValues: [{ ...storyBooleanFlagValue, rulesJson: [] }],
          },
          {
            ...storyFeatureFlags[0],
            id: "flag_default",
            key: "defaultFlag",
            name: "Default flag",
            environmentValues: [
              { ...storyBooleanFlagValue, percentageOptionsJson: [], rulesJson: [] },
            ],
            tags: [],
          },
          storyFeatureFlags[2],
        ]}
        isDeleting={false}
        isFetching={false}
        onDelete={vi.fn()}
        onSelect={vi.fn()}
        selectedFeatureFlagId="flag_default"
      />,
    );

    expect(screen.getByText("rollout")).toBeInTheDocument();
    expect(screen.getByText("default")).toBeInTheDocument();
    expect(screen.getByText("sem valor")).toBeInTheDocument();
  });
});
