import { Badge } from "@components/Badge";
import { Button } from "@components/Button";
import {
  BulkActions,
  ColumnHeader,
  Pagination,
  SelectionCheckbox,
  Table,
  useTable,
} from "@components/table";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ColumnDef } from "@tanstack/react-table";

type DemoRow = {
  id: string;
  name: string;
  status: "active" | "archived";
};

const rows: DemoRow[] = [
  { id: "cfg_default", name: "Default", status: "active" },
  { id: "cfg_checkout", name: "Checkout", status: "archived" },
  { id: "cfg_mobile", name: "Mobile", status: "active" },
];

const meta = {
  title: "Components/Table",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const SortableSelectable: Story = {
  render: () => <DemoTable />,
};

function DemoTable() {
  const columns: ColumnDef<DemoRow>[] = [
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
          aria-label="Selecionar recursos da pagina"
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
    {
      accessorKey: "status",
      cell: ({ row }) => <Badge variant="secondary">{row.original.status}</Badge>,
      header: ({ column }) => <ColumnHeader column={column} title="Status" />,
    },
  ];
  const table = useTable({
    columns,
    data: rows,
    enableRowSelection: true,
    getRowId: (row) => row.id,
  });

  return (
    <div className="grid max-w-3xl gap-4 p-4">
      <Table emptyMessage="Nenhum recurso." table={table} />
      <Pagination table={table} />
      <BulkActions
        selectionLabel={(count) =>
          count === 1 ? "1 recurso selecionado" : `${count} recursos selecionados`
        }
        table={table}
      >
        <Button type="button" variant="danger">
          Arquivar
        </Button>
      </BulkActions>
    </div>
  );
}
