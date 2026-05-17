import { formatResourceLabel } from "@core/strings/formatResourceLabel";
import type { ColumnDef } from "@tanstack/react-table";
import { ActionMenu, ActionMenuItem } from "./ActionMenu";
import { Badge } from "./Badge";
import { DataToolbar, SearchField } from "./DataToolbar";
import { ErrorMessage } from "./ErrorMessage";
import { InlineNameEditor } from "./InlineNameEditor";
import { Panel } from "./Panel";
import { PermissionHint } from "./PermissionHint";
import { ColumnHeader, Pagination, Table, useTable } from "./table";

type ResourcePanelProps<TResource extends { id: string; key: string; name: string }> = {
  canEditName?: boolean;
  emptyMessage: string;
  getDescription?: (item: TResource) => string | null | undefined;
  items: TResource[];
  mutationError?: unknown;
  nameEditDisabled?: boolean;
  onRename?: (item: TResource, name: string) => Promise<unknown> | unknown;
  onSelect: (resourceId: string) => void;
  permissionHint?: string;
  queryError: unknown;
  selectedId: string;
  title: string;
};

export function ResourcePanel<TResource extends { id: string; key: string; name: string }>({
  canEditName = false,
  emptyMessage,
  getDescription,
  items,
  mutationError,
  nameEditDisabled = false,
  onRename,
  onSelect,
  permissionHint,
  queryError,
  selectedId,
  title,
}: ResourcePanelProps<TResource>) {
  const columns: ColumnDef<TResource>[] = [
    {
      accessorFn: (item) => item.name,
      cell: ({ row }) => {
        const description = getDescription?.(row.original);

        return (
          <div>
            {onRename ? (
              <InlineNameEditor
                canEdit={canEditName}
                disabled={nameEditDisabled}
                displayClassName="block truncate text-foreground"
                editLabel={`Editar ${row.original.name}`}
                inputClassName="sm:w-64"
                name={row.original.name}
                onSubmit={(name) => onRename(row.original, name)}
              />
            ) : (
              <strong className="block text-foreground">{row.original.name}</strong>
            )}
            <span className="block text-xs text-muted-foreground">
              {formatResourceLabel(row.original)}
            </span>
            {description ? (
              <span className="mt-1 block max-w-xl truncate text-xs text-muted-foreground">
                {description}
              </span>
            ) : null}
          </div>
        );
      },
      header: ({ column }) => <ColumnHeader column={column} title={title} />,
      id: "resource",
      meta: { tdClassName: "min-w-52" },
    },
    {
      accessorKey: "key",
      cell: ({ row }) => row.original.key,
      header: ({ column }) => <ColumnHeader column={column} title="Key" />,
      meta: { tdClassName: "font-mono text-xs text-muted-foreground" },
    },
    {
      cell: ({ row }) =>
        selectedId === row.original.id ? <Badge variant="secondary">Selecionado</Badge> : null,
      enableSorting: false,
      header: "Status",
      id: "status",
    },
    {
      cell: ({ row }) => (
        <ActionMenu label={`Acoes para ${row.original.name}`}>
          <ActionMenuItem
            disabled={selectedId === row.original.id}
            onClick={() => onSelect(row.original.id)}
          >
            Selecionar
          </ActionMenuItem>
        </ActionMenu>
      ),
      enableHiding: false,
      enableSorting: false,
      header: "Acoes",
      id: "actions",
      meta: { className: "w-10 text-right" },
    },
  ];
  const table = useTable({
    columns,
    data: items,
    getRowId: (item) => item.id,
    globalFilterFn: (row, _columnId, filterValue) =>
      [
        row.original.name,
        row.original.key,
        formatResourceLabel(row.original),
        getDescription?.(row.original) ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(String(filterValue).trim().toLowerCase()),
  });

  return (
    <Panel showTitle={false} title={title}>
      {permissionHint ? <PermissionHint>{permissionHint}</PermissionHint> : null}
      <ErrorMessage error={queryError} />
      <ErrorMessage error={mutationError} />
      <DataToolbar>
        <SearchField
          aria-label={`Filtrar ${title}`}
          onChange={(event) => {
            table.setGlobalFilter(event.target.value);
            table.setPageIndex(0);
          }}
          placeholder="Filter by name or key..."
          value={table.getState().globalFilter ?? ""}
        />
      </DataToolbar>
      <Table
        emptyMessage={items.length === 0 ? emptyMessage : `Nenhum item encontrado em ${title}.`}
        getRowAriaLabel={(row) => `Selecionar ${row.original.name}`}
        getRowState={(row) => (selectedId === row.original.id ? "selected" : undefined)}
        onRowActivate={(row) => onSelect(row.original.id)}
        table={table}
      />
      <Pagination table={table} />
    </Panel>
  );
}
