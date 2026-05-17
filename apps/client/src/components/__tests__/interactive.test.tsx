import { ActionMenu, ActionMenuItem, ActionMenuLink } from "@components/ActionMenu";
import { Button } from "@components/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/Dialog";
import { ResourcePanel } from "@components/ResourcePanel";
import { ResourceSwitcher } from "@components/ResourceSwitcher";
import {
  PrimitiveClickableTableRow,
  PrimitiveTable,
  PrimitiveTableBody,
  PrimitiveTableCaption,
  PrimitiveTableCell,
  PrimitiveTableFooter,
  PrimitiveTableHead,
  PrimitiveTableHeader,
  PrimitiveTableRow,
} from "@components/table";
import { renderWithProviders } from "@src/test/render";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Folder } from "lucide-react";
import type { MouseEvent } from "react";
import { describe, expect, it, vi } from "vitest";

describe("interactive shared components", () => {
  it("opens action menu items and links", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <ActionMenu label="Acoes do item">
        <ActionMenuItem onClick={onSelect}>Editar</ActionMenuItem>
        <ActionMenuLink to="/organizations/org_1">Abrir</ActionMenuLink>
      </ActionMenu>,
    );

    await user.click(screen.getByRole("button", { name: "Acoes do item" }));
    expect((await screen.findByText("Abrir")).closest("a")).toHaveAttribute(
      "href",
      "/organizations/org_1",
    );
    await user.click(await screen.findByText("Editar"));

    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("renders dialog content and closes from the built-in close button", async () => {
    const user = userEvent.setup();

    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button type="button">Abrir dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar acao</DialogTitle>
            <DialogDescription>Esta acao sera aplicada.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );

    await user.click(screen.getByRole("button", { name: "Abrir dialog" }));
    expect(await screen.findByRole("dialog", { name: "Confirmar acao" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Fechar" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Confirmar acao" })).not.toBeInTheDocument(),
    );
  });

  it("activates clickable table rows with mouse and keyboard", async () => {
    const onActivate = vi.fn();
    const onPrevented = vi.fn((event: MouseEvent<HTMLTableRowElement>) => {
      event.preventDefault();
    });
    const user = userEvent.setup();

    render(
      <PrimitiveTable>
        <PrimitiveTableCaption>Recursos</PrimitiveTableCaption>
        <PrimitiveTableHeader>
          <PrimitiveTableRow>
            <PrimitiveTableHead>Nome</PrimitiveTableHead>
          </PrimitiveTableRow>
        </PrimitiveTableHeader>
        <PrimitiveTableBody>
          <PrimitiveClickableTableRow aria-label="Selecionar default" onActivate={onActivate}>
            <PrimitiveTableCell>Default</PrimitiveTableCell>
          </PrimitiveClickableTableRow>
          <PrimitiveClickableTableRow
            aria-label="Selecionar bloqueado"
            onActivate={onActivate}
            onClick={onPrevented}
          >
            <PrimitiveTableCell>Bloqueado</PrimitiveTableCell>
          </PrimitiveClickableTableRow>
        </PrimitiveTableBody>
        <PrimitiveTableFooter>
          <PrimitiveTableRow>
            <PrimitiveTableCell>Total</PrimitiveTableCell>
          </PrimitiveTableRow>
        </PrimitiveTableFooter>
      </PrimitiveTable>,
    );

    const row = screen.getByRole("button", { name: "Selecionar default" });

    await user.click(row);
    row.focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    await user.click(screen.getByRole("button", { name: "Selecionar bloqueado" }));

    expect(onActivate).toHaveBeenCalledTimes(3);
    expect(onPrevented).toHaveBeenCalledOnce();
  });

  it("renders resource switchers for collapsed, disabled and dropdown states", async () => {
    const onChange = vi.fn();
    const onCreate = vi.fn();
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    const options = [
      { id: "project_1", name: "Console", slug: "console" },
      { id: "project_2", name: "Mobile", slug: "mobile" },
    ];

    renderWithProviders(
      <>
        <ResourceSwitcher
          collapsed
          createLabel="Novo projeto"
          disabled={false}
          icon={Folder}
          isActive
          label="Projetos"
          onChange={onChange}
          onCreate={onCreate}
          onNavigate={onNavigate}
          options={options}
          path="/organizations/org_1/projects"
          placeholder="Sem projetos"
          value="project_1"
        />
        <ResourceSwitcher
          collapsed
          createLabel="Novo config"
          disabled
          icon={Folder}
          isActive={false}
          label="Configs"
          onChange={onChange}
          onCreate={onCreate}
          options={[]}
          path="/configs"
          placeholder="Sem configs"
          value=""
        />
        <ResourceSwitcher
          collapsed={false}
          createLabel="Novo environment"
          disabled={false}
          icon={Folder}
          isActive={false}
          label="Ambientes"
          onChange={onChange}
          onCreate={onCreate}
          onNavigate={onNavigate}
          options={options}
          path="/environments"
          placeholder="Sem ambientes"
          value="project_1"
        />
      </>,
    );

    await user.click(screen.getByRole("link", { name: "Projetos" }));
    await user.click(screen.getByRole("button", { name: "Selecionar Ambientes" }));
    await user.click(await screen.findByText("Mobile"));
    await user.click(screen.getByRole("button", { name: "Selecionar Ambientes" }));
    await user.click(await screen.findByText("Novo environment"));

    expect(screen.getByTitle("Configs: Sem configs")).toHaveAttribute("aria-disabled", "true");
    expect(onNavigate).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith("project_2");
    expect(onCreate).toHaveBeenCalledOnce();
  });

  it("filters, selects and renames resources in ResourcePanel", async () => {
    const onBulkDelete = vi.fn();
    const onDelete = vi.fn();
    const onSelect = vi.fn();
    const onRename = vi.fn(async () => undefined);
    const user = userEvent.setup();
    const items = [
      { id: "cfg_default", key: "default", name: "Default" },
      { id: "cfg_checkout", key: "checkout", name: "Checkout" },
    ];

    renderWithProviders(
      <ResourcePanel
        canEditName
        deleteLabel="Excluir"
        emptyMessage="Sem configs"
        getDescription={(item) => (item.id === "cfg_default" ? "Runtime" : null)}
        items={items}
        mutationError={new Error("Erro ao renomear")}
        onBulkDelete={onBulkDelete}
        onDelete={onDelete}
        onRename={onRename}
        onSelect={onSelect}
        permissionHint="Voce pode editar"
        queryError={null}
        selectedId="cfg_default"
        title="Configs"
      />,
    );

    expect(screen.getByText("Selecionado")).toBeInTheDocument();
    expect(screen.getByText("Erro ao renomear")).toBeInTheDocument();
    expect(screen.getByText("Voce pode editar")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Selecionar Checkout" }));
    expect(onSelect).toHaveBeenCalledWith("cfg_checkout");

    await user.click(screen.getByRole("button", { name: "Acoes para Checkout" }));
    await user.click(await screen.findByLabelText("Excluir Checkout"));
    expect(onDelete).toHaveBeenCalledWith(items[1]);

    await user.type(screen.getByLabelText("Filtrar Configs"), "checkout");
    expect(screen.queryByText("Default")).not.toBeInTheDocument();
    expect(screen.getByText("Checkout")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Filtrar Configs"));
    await user.click(screen.getByRole("checkbox", { name: "Selecionar Default" }));
    await user.click(screen.getByRole("button", { name: "Excluir" }));
    expect(onBulkDelete).toHaveBeenCalledWith([items[0]]);

    await user.click(screen.getByRole("button", { name: "Editar Default" }));
    await user.clear(screen.getByRole("textbox", { name: "Nome" }));
    await user.type(screen.getByRole("textbox", { name: "Nome" }), "Default renamed");
    await user.click(screen.getByRole("button", { name: "Salvar nome" }));

    await waitFor(() => expect(onRename).toHaveBeenCalledWith(items[0], "Default renamed"));
  });
});
