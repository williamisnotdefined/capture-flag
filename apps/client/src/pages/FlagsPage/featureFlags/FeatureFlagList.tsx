import { ActionMenu, ActionMenuItem } from "@components/ActionMenu";
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
import type { FeatureFlag } from "@src/types";
import type { ColumnDef } from "@tanstack/react-table";
import cls from "classnames";
import { Trash2 } from "lucide-react";
import { featureFlagStateLabels, getFeatureFlagOperationalState } from "./utils";

type FeatureFlagListProps = {
  canManageFeatureFlags: boolean;
  environmentId: string;
  flags: FeatureFlag[];
  isDeleting: boolean;
  isFetching: boolean;
  onBulkDelete: (featureFlagIds: string[]) => void;
  onDelete: (featureFlagId: string) => void;
  onSelect: (featureFlagId: string) => void;
  selectedFeatureFlagId: string;
};

export function FeatureFlagList({
  canManageFeatureFlags,
  environmentId,
  flags,
  isDeleting,
  isFetching,
  onBulkDelete,
  onDelete,
  onSelect,
  selectedFeatureFlagId,
}: FeatureFlagListProps) {
  const columns: ColumnDef<FeatureFlag>[] = [
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
          aria-label="Selecionar flags da pagina"
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
      accessorFn: (flag) => flag.name,
      cell: ({ row }) => (
        <div className="grid gap-1 text-left">
          <strong className="block text-foreground">{row.original.name}</strong>
          <span className="block break-all font-mono text-xs text-muted-foreground">
            {row.original.key}
          </span>
          {row.original.tags.length > 0 ? (
            <span className="mt-1 flex flex-wrap gap-1">
              {row.original.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </span>
          ) : null}
        </div>
      ),
      header: ({ column }) => <ColumnHeader column={column} title="Flag" />,
      id: "flag",
      meta: { tdClassName: "min-w-72 max-w-0 whitespace-normal" },
    },
    {
      accessorKey: "type",
      cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
      header: ({ column }) => <ColumnHeader column={column} title="Type" />,
    },
    {
      accessorFn: (flag) => getFlagState(flag, environmentId),
      cell: ({ row }) => (
        <FeatureFlagStateBadge state={getFlagState(row.original, environmentId)} />
      ),
      header: ({ column }) => <ColumnHeader column={column} title="Status" />,
      id: "status",
    },
    {
      cell: ({ row }) => (
        <ActionMenu label={`Acoes para ${row.original.name}`}>
          <ActionMenuItem onClick={() => onSelect(row.original.id)}>Editar</ActionMenuItem>
          <ActionMenuItem
            destructive
            disabled={!canManageFeatureFlags || isDeleting}
            onClick={() => onDelete(row.original.id)}
          >
            Apagar
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
    data: flags,
    enableRowSelection: canManageFeatureFlags && !isDeleting,
    getRowId: (flag) => flag.id,
  });
  const selectedFlags = table.getFilteredSelectedRowModel().rows.map((row) => row.original);

  return (
    <div className="grid gap-3 self-start">
      <Table
        emptyMessage="Nenhuma flag encontrada nesta config."
        getRowAriaLabel={(row) => `Editar ${row.original.name}`}
        getRowState={(row) =>
          row.original.id === selectedFeatureFlagId || row.getIsSelected() ? "selected" : undefined
        }
        onRowActivate={(row) => onSelect(row.original.id)}
        table={table}
      />
      <Pagination table={table} />
      <BulkActions
        selectionLabel={(selectedCount) =>
          selectedCount === 1 ? "1 flag selecionada" : `${selectedCount} flags selecionadas`
        }
        table={table}
      >
        <Button
          disabled={!canManageFeatureFlags || isDeleting || selectedFlags.length === 0}
          onClick={() => {
            onBulkDelete(selectedFlags.map((flag) => flag.id));
            table.resetRowSelection();
          }}
          type="button"
          variant="danger"
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
          Apagar
        </Button>
      </BulkActions>
      {isFetching ? <p className="text-sm text-muted-foreground">Atualizando flags...</p> : null}
    </div>
  );
}

function getFlagState(flag: FeatureFlag, environmentId: string) {
  return environmentId ? getFeatureFlagOperationalState(flag, environmentId) : "missing";
}

function FeatureFlagStateBadge({ state }: { state: ReturnType<typeof getFlagState> }) {
  return (
    <Badge
      className={cls({
        "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300":
          state === "missing",
        "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300":
          state === "default",
        "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300":
          state === "rules",
        "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300":
          state === "rollout",
      })}
      variant="outline"
    >
      {featureFlagStateLabels[state]}
    </Badge>
  );
}
