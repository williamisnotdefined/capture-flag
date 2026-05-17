import { ActionMenu, ActionMenuItem } from "@components/ActionMenu";
import { Badge } from "@components/Badge";
import { Button } from "@components/Button";
import { DataToolbar, FilterSelect, SearchField } from "@components/DataToolbar";
import {
  BulkActions,
  ColumnHeader,
  Pagination,
  SelectionCheckbox,
  Table,
  useTable,
} from "@components/table";
import { formatDateTime } from "@core/date/formatDateTime";
import type { SdkKey } from "@src/types";
import type { ColumnDef } from "@tanstack/react-table";
import cls from "classnames";
import { Trash2 } from "lucide-react";

type SdkKeyListProps = {
  canManageProjectResources: boolean;
  isFetching: boolean;
  isMutating: boolean;
  onBulkRevoke: (sdkKeyIds: string[]) => void;
  onRevoke: (sdkKeyId: string) => void;
  onRotate: (sdkKeyId: string) => void;
  sdkKeys: SdkKey[];
};

export function SdkKeyList({
  canManageProjectResources,
  isFetching,
  isMutating,
  onBulkRevoke,
  onRevoke,
  onRotate,
  sdkKeys,
}: SdkKeyListProps) {
  const configOptions = uniqueOptions(
    sdkKeys.map((sdkKey) => ({ id: sdkKey.config.id, name: sdkKey.config.name })),
  );
  const environmentOptions = uniqueOptions(
    sdkKeys.map((sdkKey) => ({ id: sdkKey.environment.id, name: sdkKey.environment.name })),
  );
  const columns: ColumnDef<SdkKey>[] = [
    {
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
          aria-label="Selecionar SDK keys da pagina"
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
      accessorFn: (sdkKey) => sdkKey.name,
      cell: ({ row }) => (
        <div>
          <strong className="block text-foreground">{row.original.name}</strong>
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.keyPrefix}...
          </span>
        </div>
      ),
      header: ({ column }) => <ColumnHeader column={column} title="SDK Key" />,
      id: "sdkKey",
      meta: { tdClassName: "min-w-48" },
    },
    {
      accessorFn: (sdkKey) => `${sdkKey.config.name} / ${sdkKey.environment.name}`,
      cell: ({ row }) => `${row.original.config.name} / ${row.original.environment.name}`,
      header: ({ column }) => <ColumnHeader column={column} title="Config / ambiente" />,
      id: "configEnvironment",
      meta: { tdClassName: "min-w-48" },
    },
    {
      accessorFn: sdkKeyStatus,
      cell: ({ row }) => <SdkKeyStatusCell sdkKey={row.original} />,
      filterFn: (row, columnId, filterValue) => row.getValue(columnId) === filterValue,
      header: ({ column }) => <ColumnHeader column={column} title="Status" />,
      id: "status",
    },
    {
      accessorFn: (sdkKey) => sdkKey.lastUsedAt ?? "",
      cell: ({ row }) =>
        row.original.lastUsedAt ? formatDateTime(row.original.lastUsedAt) : "nunca",
      header: ({ column }) => <ColumnHeader column={column} title="Ultimo uso" />,
      id: "lastUsedAt",
    },
    {
      accessorFn: (sdkKey) => sdkKey.config.id,
      filterFn: (row, columnId, filterValue) => row.getValue(columnId) === filterValue,
      header: "Config",
      id: "configId",
    },
    {
      accessorFn: (sdkKey) => sdkKey.environment.id,
      filterFn: (row, columnId, filterValue) => row.getValue(columnId) === filterValue,
      header: "Environment",
      id: "environmentId",
    },
    {
      cell: ({ row }) => (
        <ActionMenu label={`Acoes para ${row.original.name}`}>
          <ActionMenuItem
            disabled={!canManageProjectResources || isMutating || Boolean(row.original.revokedAt)}
            onClick={() => onRotate(row.original.id)}
          >
            Rotacionar
          </ActionMenuItem>
          <ActionMenuItem
            destructive
            disabled={!canManageProjectResources || isMutating || Boolean(row.original.revokedAt)}
            onClick={() => onRevoke(row.original.id)}
          >
            Revogar
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
    data: sdkKeys,
    enableRowSelection: (row) =>
      canManageProjectResources && !isMutating && !row.original.revokedAt,
    getRowId: (sdkKey) => sdkKey.id,
    globalFilterFn: (row, _columnId, filterValue) =>
      [
        row.original.name,
        row.original.keyPrefix,
        row.original.config.name,
        row.original.environment.name,
        row.original.revokedAt ? "revogada" : "ativa",
      ]
        .join(" ")
        .toLowerCase()
        .includes(String(filterValue).trim().toLowerCase()),
    initialColumnVisibility: {
      configId: false,
      environmentId: false,
    },
  });
  const statusFilter = (table.getColumn("status")?.getFilterValue() as string | undefined) ?? "all";
  const configFilter =
    (table.getColumn("configId")?.getFilterValue() as string | undefined) ?? "all";
  const environmentFilter =
    (table.getColumn("environmentId")?.getFilterValue() as string | undefined) ?? "all";
  const selectedSdkKeys = table.getFilteredSelectedRowModel().rows.map((row) => row.original);

  return (
    <div className="grid gap-4">
      <DataToolbar>
        <SearchField
          aria-label="Filtrar SDK keys"
          onChange={(event) => {
            table.setGlobalFilter(event.target.value);
            table.setPageIndex(0);
          }}
          placeholder="Filter by key, config or environment..."
          value={table.getState().globalFilter ?? ""}
        />
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            aria-label="Filtrar SDK keys por status"
            label="Status"
            onChange={(event) => {
              table
                .getColumn("status")
                ?.setFilterValue(event.target.value === "all" ? undefined : event.target.value);
              table.setPageIndex(0);
            }}
            value={statusFilter}
            valueLabel={statusFilter === "all" ? undefined : formatStatusFilter(statusFilter)}
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativas</option>
            <option value="revoked">Revogadas</option>
          </FilterSelect>
          <FilterSelect
            aria-label="Filtrar SDK keys por config"
            label="Config"
            onChange={(event) => {
              table
                .getColumn("configId")
                ?.setFilterValue(event.target.value === "all" ? undefined : event.target.value);
              table.setPageIndex(0);
            }}
            value={configFilter}
            valueLabel={optionLabel(configOptions, configFilter)}
          >
            <option value="all">Todas as configs</option>
            {configOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            aria-label="Filtrar SDK keys por environment"
            label="Environment"
            onChange={(event) => {
              table
                .getColumn("environmentId")
                ?.setFilterValue(event.target.value === "all" ? undefined : event.target.value);
              table.setPageIndex(0);
            }}
            value={environmentFilter}
            valueLabel={optionLabel(environmentOptions, environmentFilter)}
          >
            <option value="all">Todos os environments</option>
            {environmentOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </FilterSelect>
        </div>
      </DataToolbar>
      <Table
        emptyMessage={
          sdkKeys.length === 0 && !isFetching ? "Sem SDK keys." : "Nenhuma SDK key encontrada."
        }
        getRowClassName={() => "text-foreground"}
        table={table}
      />
      <Pagination table={table} />
      <BulkActions
        selectionLabel={(selectedCount) =>
          selectedCount === 1 ? "1 SDK key selecionada" : `${selectedCount} SDK keys selecionadas`
        }
        table={table}
      >
        <Button
          disabled={!canManageProjectResources || isMutating || selectedSdkKeys.length === 0}
          onClick={() => {
            onBulkRevoke(selectedSdkKeys.map((sdkKey) => sdkKey.id));
            table.resetRowSelection();
          }}
          type="button"
          variant="danger"
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
          Revogar
        </Button>
      </BulkActions>
      {isFetching ? <p className="text-sm text-muted-foreground">Atualizando SDK keys...</p> : null}
    </div>
  );
}

function sdkKeyStatus(sdkKey: SdkKey) {
  return sdkKey.revokedAt ? "revoked" : "active";
}

function SdkKeyStatusCell({ sdkKey }: { sdkKey: SdkKey }) {
  return (
    <div className="grid gap-1">
      <Badge
        className={cls({
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300":
            !sdkKey.revokedAt,
          "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300":
            sdkKey.revokedAt,
        })}
        variant="outline"
      >
        {sdkKey.revokedAt ? "revogada" : "ativa"}
      </Badge>
      <span className="text-xs text-muted-foreground">
        Criada {formatDateTime(sdkKey.createdAt)}
      </span>
    </div>
  );
}

function uniqueOptions(options: Array<{ id: string; name: string }>) {
  return Array.from(new Map(options.map((option) => [option.id, option])).values()).sort(
    (left, right) => left.name.localeCompare(right.name),
  );
}

function optionLabel(options: Array<{ id: string; name: string }>, value: string) {
  if (value === "all") {
    return undefined;
  }

  return options.find((option) => option.id === value)?.name;
}

function formatStatusFilter(value: string) {
  if (value === "active") {
    return "Ativas";
  }

  if (value === "revoked") {
    return "Revogadas";
  }

  return undefined;
}
