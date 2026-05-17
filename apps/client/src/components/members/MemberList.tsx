import { ActionMenu, ActionMenuItem } from "@components/ActionMenu";
import { Button } from "@components/Button";
import { DataToolbar, SearchField } from "@components/DataToolbar";
import { SelectInput } from "@components/FormControls";
import {
  BulkActions,
  ColumnHeader,
  Pagination,
  SelectionCheckbox,
  Table,
  useTable,
} from "@components/table";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import type { MemberListItem } from "./types";

type MemberListProps = {
  disabled?: boolean;
  emptyMessage: string;
  getAvailableRoles?: (member: MemberListItem) => readonly string[];
  canRemoveMember?: (member: MemberListItem) => boolean;
  members: MemberListItem[];
  onRemoveMember?: (memberId: string) => void;
  onRoleChange?: (memberId: string, role: string) => void;
  roles?: readonly string[];
};

export function MemberList({
  disabled = false,
  emptyMessage,
  getAvailableRoles,
  canRemoveMember,
  members,
  onRemoveMember,
  onRoleChange,
  roles = [],
}: MemberListProps) {
  const columns: ColumnDef<MemberListItem>[] = [
    {
      cell: ({ row }) => (
        <SelectionCheckbox
          aria-label={`Selecionar ${row.original.user.name}`}
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onChange={(event) => row.toggleSelected(event.target.checked)}
        />
      ),
      enableHiding: false,
      enableSorting: false,
      header: ({ table }) => (
        <SelectionCheckbox
          aria-label="Selecionar membros da pagina"
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
      accessorFn: (member) => member.user.name,
      cell: ({ row }) => (
        <div>
          <strong className="block text-foreground">{row.original.user.name}</strong>
          <span className="block break-all font-mono text-xs text-muted-foreground">
            {row.original.user.id}
          </span>
        </div>
      ),
      header: ({ column }) => <ColumnHeader column={column} title="Membro" />,
      id: "member",
      meta: { tdClassName: "min-w-52" },
    },
    {
      accessorFn: (member) => member.user.email ?? "",
      cell: ({ row }) => row.original.user.email ?? "sem email",
      header: ({ column }) => <ColumnHeader column={column} title="Email" />,
      id: "email",
      meta: { tdClassName: "max-w-64 whitespace-normal break-all" },
    },
    {
      accessorKey: "role",
      cell: ({ row }) => (
        <MemberRoleCell
          disabled={disabled}
          getAvailableRoles={getAvailableRoles}
          member={row.original}
          onRoleChange={onRoleChange}
          roles={roles}
        />
      ),
      header: ({ column }) => <ColumnHeader column={column} title="Role" />,
    },
    {
      cell: ({ row }) =>
        onRemoveMember ? (
          <ActionMenu label={`Acoes para ${row.original.user.name}`}>
            <ActionMenuItem
              destructive
              disabled={disabled || !(canRemoveMember?.(row.original) ?? true)}
              onClick={() => onRemoveMember(row.original.id)}
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              Remover
            </ActionMenuItem>
          </ActionMenu>
        ) : null,
      enableHiding: false,
      enableSorting: false,
      header: "Acoes",
      id: "actions",
      meta: { className: "w-10 text-right" },
    },
  ];
  const table = useTable({
    columns,
    data: members,
    enableRowSelection: (row) =>
      Boolean(onRemoveMember) && !disabled && (canRemoveMember?.(row.original) ?? true),
    getRowId: (member) => member.id,
    globalFilterFn: (row, _columnId, filterValue) =>
      [
        row.original.user.name,
        row.original.user.email ?? "",
        row.original.user.id,
        row.original.role,
      ]
        .join(" ")
        .toLowerCase()
        .includes(String(filterValue).trim().toLowerCase()),
  });
  const selectedMembers = table.getFilteredSelectedRowModel().rows.map((row) => row.original);

  return (
    <div className="mt-4 grid gap-4">
      <DataToolbar>
        <SearchField
          aria-label="Filtrar membros"
          onChange={(event) => {
            table.setGlobalFilter(event.target.value);
            table.setPageIndex(0);
          }}
          placeholder="Filter by member, email or role..."
          value={table.getState().globalFilter ?? ""}
        />
      </DataToolbar>
      <Table
        emptyMessage={members.length === 0 ? emptyMessage : "Nenhum membro encontrado."}
        getRowClassName={() => "text-foreground"}
        table={table}
      />
      <Pagination table={table} />
      {onRemoveMember ? (
        <BulkActions
          selectionLabel={(selectedCount) => formatMemberSelectionLabel(selectedCount)}
          table={table}
        >
          <Button
            disabled={disabled || selectedMembers.length === 0}
            onClick={() => {
              for (const member of selectedMembers) {
                onRemoveMember(member.id);
              }
              table.resetRowSelection();
            }}
            type="button"
            variant="danger"
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
            Remover
          </Button>
        </BulkActions>
      ) : null}
    </div>
  );
}

type MemberRoleCellProps = {
  disabled: boolean;
  getAvailableRoles?: (member: MemberListItem) => readonly string[];
  member: MemberListItem;
  onRoleChange?: (memberId: string, role: string) => void;
  roles: readonly string[];
};

function MemberRoleCell({
  disabled,
  getAvailableRoles,
  member,
  onRoleChange,
  roles,
}: MemberRoleCellProps) {
  const roleOptions = getAvailableRoles?.(member) ?? roles;
  const canChangeRole = Boolean(onRoleChange && roleOptions.length > 0);

  return canChangeRole ? (
    <SelectInput
      className="min-w-32"
      disabled={disabled || roleOptions.length <= 1}
      onChange={(event) => onRoleChange?.(member.id, event.target.value)}
      value={member.role}
    >
      {roleOptions.map((role) => (
        <option key={role} value={role}>
          {role}
        </option>
      ))}
    </SelectInput>
  ) : (
    <span className="block font-semibold">{member.role}</span>
  );
}

function formatMemberSelectionLabel(selectedCount: number) {
  return selectedCount === 1 ? "1 membro selecionado" : `${selectedCount} membros selecionados`;
}
