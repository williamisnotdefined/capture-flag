import { Button } from "@components/Button";
import {
  BulkActions,
  ColumnHeader,
  Pagination,
  SelectionCheckbox,
  Table,
  useTable,
} from "@components/table";
import type { ColumnDef } from "@tanstack/react-table";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

type TestRow = {
  id: string;
  name: string;
};

const testRows: TestRow[] = [
  { id: "row_beta", name: "Beta" },
  { id: "row_alpha", name: "Alpha" },
];

describe("table components", () => {
  it("sorts rows from column headers and runs bulk actions", async () => {
    const onBulkAction = vi.fn();
    const user = userEvent.setup();

    render(<TestTable onBulkAction={onBulkAction} />);

    expect(screen.getAllByRole("row")[1]).toHaveTextContent("Beta");

    await user.click(screen.getByRole("button", { name: "Ordenar por Name" }));
    expect(screen.getAllByRole("row")[1]).toHaveTextContent("Alpha");

    await user.click(screen.getByRole("checkbox", { name: "Selecionar Alpha" }));
    expect(screen.getByRole("toolbar", { name: "1 item selecionado" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Arquivar" }));
    expect(onBulkAction).toHaveBeenCalledWith(["row_alpha"]);
  });
});

function TestTable({ onBulkAction }: { onBulkAction: (ids: string[]) => void }) {
  const columns: ColumnDef<TestRow>[] = [
    {
      cell: ({ row }) => (
        <SelectionCheckbox
          aria-label={`Selecionar ${row.original.name}`}
          checked={row.getIsSelected()}
          onChange={(event) => row.toggleSelected(event.target.checked)}
        />
      ),
      enableSorting: false,
      header: ({ table }) => (
        <SelectionCheckbox
          aria-label="Selecionar linhas da pagina"
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : false
          }
          onChange={(event) => table.toggleAllPageRowsSelected(event.target.checked)}
        />
      ),
      id: "select",
      meta: { className: "w-10" },
    },
    {
      accessorKey: "name",
      header: ({ column }) => <ColumnHeader column={column} title="Name" />,
    },
  ];
  const table = useTable({
    columns,
    data: testRows,
    enableRowSelection: true,
    getRowId: (row) => row.id,
  });
  const selectedIds = table.getFilteredSelectedRowModel().rows.map((row) => row.original.id);

  return (
    <div className="grid gap-4">
      <Table emptyMessage="Sem linhas" table={table} />
      <Pagination table={table} />
      <BulkActions selectionLabel={(count) => `${count} item selecionado`} table={table}>
        <Button onClick={() => onBulkAction(selectedIds)} type="button" variant="danger">
          Arquivar
        </Button>
      </BulkActions>
    </div>
  );
}
