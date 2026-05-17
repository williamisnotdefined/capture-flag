import { formatResourceLabel } from "@core/strings/formatResourceLabel";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { ActionMenu, ActionMenuItem } from "./ActionMenu";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { DataToolbar, SearchField } from "./DataToolbar";
import { ErrorMessage } from "./ErrorMessage";
import { InlineNameEditor } from "./InlineNameEditor";
import { Panel } from "./Panel";
import { PermissionHint } from "./PermissionHint";
import { BulkActions, ColumnHeader, Pagination, SelectionCheckbox, Table, useTable } from "./table";

type ResourcePanelProps<TResource extends { id: string; key: string; name: string }> = {
  canEditName?: boolean;
  canDeleteItem?: (item: TResource) => boolean;
  deleteDisabled?: boolean;
  deleteLabel?: string;
  emptyMessage: string;
  getDescription?: (item: TResource) => string | null | undefined;
  items: TResource[];
  mutationError?: unknown;
  nameEditDisabled?: boolean;
  onBulkDelete?: (items: TResource[]) => void;
  onDelete?: (item: TResource) => void;
  onRename?: (item: TResource, name: string) => Promise<unknown> | unknown;
  onSelect: (resourceId: string) => void;
  permissionHint?: string;
  queryError: unknown;
  selectionLabel?: (selectedCount: number) => string;
  selectedId: string;
  title: string;
};

export function ResourcePanel<TResource extends { id: string; key: string; name: string }>({
  canEditName = false,
  canDeleteItem,
  deleteDisabled = false,
  deleteLabel = "Excluir",
  emptyMessage,
  getDescription,
  items,
  mutationError,
  nameEditDisabled = false,
  onBulkDelete,
  onDelete,
  onRename,
  onSelect,
  permissionHint,
  queryError,
  selectionLabel = formatResourceSelectionLabel,
  selectedId,
  title,
}: ResourcePanelProps<TResource>) {
  const canDeleteResource = (item: TResource) => !deleteDisabled && (canDeleteItem?.(item) ?? true);
  const columns: ColumnDef<TResource>[] = [];

  if (onDelete && onBulkDelete) {
    columns.push({
      cell: ({ row }) => (
        <SelectionCheckbox
          aria-label={`Selecionar ${row.original.name}`}
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onChange={(event) => row.toggleSelected(event.target.checked)}
        />
      ),
      enableHiding: false,
      enableSorting: false,
      header: ({ table }) => (
        <SelectionCheckbox
          aria-label={`Selecionar ${title} da pagina`}
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
    });
  }

  columns.push(
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
          {onDelete ? (
            <ActionMenuItem
              aria-label={`${deleteLabel} ${row.original.name}`}
              destructive
              disabled={!canDeleteResource(row.original)}
              onClick={() => onDelete(row.original)}
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              {deleteLabel}
            </ActionMenuItem>
          ) : null}
        </ActionMenu>
      ),
      enableHiding: false,
      enableSorting: false,
      header: "Acoes",
      id: "actions",
      meta: { className: "w-10 text-right" },
    },
  );
  const table = useTable({
    columns,
    data: items,
    enableRowSelection: onDelete && onBulkDelete ? (row) => canDeleteResource(row.original) : false,
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
  const selectedItems = table.getFilteredSelectedRowModel().rows.map((row) => row.original);

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
        getRowState={(row) =>
          selectedId === row.original.id || row.getIsSelected() ? "selected" : undefined
        }
        onRowActivate={(row) => onSelect(row.original.id)}
        table={table}
      />
      <Pagination table={table} />
      {onDelete && onBulkDelete ? (
        <BulkActions selectionLabel={selectionLabel} table={table}>
          <Button
            disabled={deleteDisabled || selectedItems.length === 0}
            onClick={() => {
              onBulkDelete(selectedItems);
              table.resetRowSelection();
            }}
            type="button"
            variant="danger"
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
            {deleteLabel}
          </Button>
        </BulkActions>
      ) : null}
    </Panel>
  );
}

function formatResourceSelectionLabel(selectedCount: number) {
  return selectedCount === 1 ? "1 item selecionado" : `${selectedCount} itens selecionados`;
}
