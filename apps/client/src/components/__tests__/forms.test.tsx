import { CreateConfigForm } from "@components/CreateConfigForm";
import { CreateNameForm } from "@components/CreateNameForm";
import { CreateResourceDialog } from "@components/CreateResourceDialog";
import { InlineNameEditor } from "@components/InlineNameEditor";
import { UpdateNameForm } from "@components/UpdateNameForm";
import { renderWithProviders } from "@src/test/render";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("shared form components", () => {
  it("validates and submits CreateNameForm names", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const user = userEvent.setup();

    render(<CreateNameForm onSubmit={onSubmit} placeholder="Novo recurso" />);

    await user.click(screen.getByRole("button", { name: "Criar" }));
    expect(await screen.findByText("Informe um nome.")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Novo recurso"), "  Production  ");
    await user.click(screen.getByRole("button", { name: "Criar" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("Production"));
    expect(screen.getByPlaceholderText("Novo recurso")).toHaveValue("");
  });

  it("keeps CreateNameForm input when submit rejects", async () => {
    const onSubmit = vi.fn(async () => {
      throw new Error("falhou");
    });
    const user = userEvent.setup();

    render(<CreateNameForm onSubmit={onSubmit} placeholder="Novo recurso" />);

    await user.type(screen.getByPlaceholderText("Novo recurso"), "Config");
    await user.click(screen.getByRole("button", { name: "Criar" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("Config"));
    expect(screen.getByPlaceholderText("Novo recurso")).toHaveValue("Config");
  });

  it("normalizes CreateConfigForm optional description", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const user = userEvent.setup();

    render(<CreateConfigForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Nome"), "Default");
    await user.type(screen.getByLabelText("Descricao"), "  Runtime config  ");
    await user.click(screen.getByRole("button", { name: "Criar" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ description: "Runtime config", name: "Default" }),
    );
  });

  it("omits blank CreateConfigForm description", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const user = userEvent.setup();

    render(<CreateConfigForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Nome"), "Default");
    await user.type(screen.getByLabelText("Descricao"), "   ");
    await user.click(screen.getByRole("button", { name: "Criar" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: "Default" }));
  });

  it("keeps CreateConfigForm values when submit rejects", async () => {
    const onSubmit = vi.fn(async () => {
      throw new Error("failed");
    });
    const user = userEvent.setup();

    render(<CreateConfigForm onSubmit={onSubmit} dividedFooter />);

    await user.type(screen.getByLabelText("Nome"), "Rejected");
    await user.click(screen.getByRole("button", { name: "Criar" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: "Rejected" }));
    expect(screen.getByLabelText("Nome")).toHaveValue("Rejected");
  });

  it("submits UpdateNameForm only when dirty and resets after prop changes", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const user = userEvent.setup();
    const { rerender } = render(<UpdateNameForm name="Default" onSubmit={onSubmit} />);

    expect(screen.getByRole("button", { name: "Salvar nome" })).toBeDisabled();

    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "Renamed");
    await user.click(screen.getByRole("button", { name: "Salvar nome" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("Renamed"));

    rerender(<UpdateNameForm name="From server" onSubmit={onSubmit} />);

    expect(screen.getByRole("textbox")).toHaveValue("From server");
  });

  it("validates and preserves UpdateNameForm values when submit rejects", async () => {
    const onSubmit = vi.fn(async () => {
      throw new Error("failed");
    });
    const user = userEvent.setup();

    render(<UpdateNameForm name="Default" onSubmit={onSubmit} />);

    await user.clear(screen.getByRole("textbox"));
    await user.click(screen.getByRole("button", { name: "Salvar nome" }));
    expect(await screen.findByText("Informe um nome.")).toBeInTheDocument();

    await user.type(screen.getByRole("textbox"), "Rejected");
    await user.click(screen.getByRole("button", { name: "Salvar nome" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("Rejected"));
    expect(screen.getByRole("textbox")).toHaveValue("Rejected");
  });

  it("edits, cancels and skips unchanged names in InlineNameEditor", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const user = userEvent.setup();

    render(<InlineNameEditor canEdit name="Default" onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Editar nome" }));
    await user.click(screen.getByRole("button", { name: "Salvar nome" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Default")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Editar nome" }));
    await user.clear(screen.getByRole("textbox", { name: "Nome" }));
    await user.type(screen.getByRole("textbox", { name: "Nome" }), "Updated");
    await user.click(screen.getByRole("button", { name: "Cancelar edicao" }));

    expect(screen.getByText("Default")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Editar nome" }));
    await user.clear(screen.getByRole("textbox", { name: "Nome" }));
    await user.type(screen.getByRole("textbox", { name: "Nome" }), "Updated");
    await user.click(screen.getByRole("button", { name: "Salvar nome" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("Updated"));
  });

  it("renders InlineNameEditor as read-only without edit controls", () => {
    render(<InlineNameEditor canEdit={false} name="Read only" onSubmit={vi.fn()} />);

    expect(screen.getByText("Read only")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar nome" })).not.toBeInTheDocument();
  });

  it("renders CreateResourceDialog default form and errors", async () => {
    const onOpenChange = vi.fn();
    const onSubmit = vi.fn(async () => undefined);
    const user = userEvent.setup();

    renderWithProviders(
      <CreateResourceDialog
        description="Crie um recurso"
        disabled={false}
        error={new Error("Erro de criacao")}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        open
        placeholder="Nome"
        title="Novo recurso"
      />,
    );

    await user.type(screen.getByPlaceholderText("Nome"), "Ambiente");
    await user.click(screen.getByRole("button", { name: "Criar" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("Ambiente"));
    expect(screen.getByRole("dialog", { name: "Novo recurso" })).toBeInTheDocument();
    expect(screen.getByText("Erro de criacao")).toBeInTheDocument();
  });
});
