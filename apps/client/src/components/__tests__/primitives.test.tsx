import { Badge } from "@components/Badge";
import { DataToolbar, FilterSelect, SearchField } from "@components/DataToolbar";
import { ErrorMessage } from "@components/ErrorMessage";
import { Eyebrow } from "@components/Eyebrow";
import { FieldError } from "@components/FieldError";
import { SelectInput, TextInput, TextareaInput } from "@components/FormControls";
import { PageHeader } from "@components/PageHeader";
import { PageLayout } from "@components/PageLayout";
import { Panel } from "@components/Panel";
import { PermissionHint } from "@components/PermissionHint";
import { Shell } from "@components/Shell";
import { renderWithProviders } from "@src/test/render";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("shared component primitives", () => {
  it("renders visual wrappers and optional content", () => {
    render(
      <>
        <Badge className="custom" variant="destructive">
          Revogada
        </Badge>
        <Eyebrow>Contexto</Eyebrow>
        <FieldError>Campo invalido</FieldError>
        <ErrorMessage error={new Error("Falha da API")} />
        <ErrorMessage error={{ unknown: true }} />
        <PermissionHint>Sem permissao</PermissionHint>
        <Panel className="panel-extra" title="Recursos" wide>
          Conteudo do painel
        </Panel>
        <Panel showTitle={false} title="Titulo oculto">
          Sem titulo
        </Panel>
      </>,
    );

    expect(screen.getByText("Revogada")).toHaveClass("bg-destructive", "custom");
    expect(screen.getByText("Contexto")).toHaveClass("uppercase");
    expect(screen.getByText("Campo invalido")).toBeInTheDocument();
    expect(screen.getByText("Falha da API")).toBeInTheDocument();
    expect(screen.getByText("Erro inesperado")).toBeInTheDocument();
    expect(screen.getByText("Sem permissao")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recursos" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Titulo oculto" })).not.toBeInTheDocument();
  });

  it("returns null for empty field and error messages", () => {
    const { container } = render(
      <>
        <FieldError />
        <ErrorMessage error={null} />
      </>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders page and shell layout semantics", () => {
    renderWithProviders(
      <>
        <PageHeader
          actions={<button type="button">Acao</button>}
          description="Descricao da pagina"
          title="Titulo da pagina"
        />
        <PageLayout
          actions={<button type="button">Criar</button>}
          description="Descricao do layout"
          eyebrow="Contexto"
          title="Titulo do layout"
        >
          Conteudo do layout
        </PageLayout>
        <Shell title="Capture Flag">Conteudo do shell</Shell>
      </>,
    );

    expect(screen.getByRole("heading", { name: "Titulo da pagina" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Acao" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Titulo do layout" })).toBeInTheDocument();
    expect(screen.getByText("Conteudo do layout")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Capture Flag" })).toHaveAttribute("href", "/");
  });

  it("passes native props through form controls", () => {
    render(
      <>
        <TextInput aria-label="Nome" className="extra-input" defaultValue="Ana" />
        <SelectInput aria-label="Role" defaultValue="admin">
          <option value="viewer">viewer</option>
          <option value="admin">admin</option>
        </SelectInput>
        <TextareaInput aria-label="Descricao" defaultValue="Detalhe" />
      </>,
    );

    expect(screen.getByLabelText("Nome")).toHaveValue("Ana");
    expect(screen.getByLabelText("Nome")).toHaveClass("extra-input");
    expect(screen.getByLabelText("Role")).toHaveValue("admin");
    expect(screen.getByLabelText("Descricao")).toHaveValue("Detalhe");
  });

  it("renders toolbar actions, search and filter select", async () => {
    const onSearch = vi.fn();
    const onFilter = vi.fn();
    const user = userEvent.setup();

    render(
      <DataToolbar actions={<button type="button">Exportar</button>}>
        <SearchField aria-label="Buscar" onChange={onSearch} />
        <FilterSelect label="Status" onChange={onFilter} value="all" valueLabel="Todos">
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
        </FilterSelect>
      </DataToolbar>,
    );

    await user.type(screen.getByLabelText("Buscar"), "flag");
    await user.selectOptions(screen.getByRole("combobox"), "active");

    expect(screen.getByRole("button", { name: "Exportar" })).toBeInTheDocument();
    expect(onSearch).toHaveBeenCalled();
    expect(onFilter).toHaveBeenCalled();
  });
});
