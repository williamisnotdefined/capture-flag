import { Trash2 } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { ActionMenu, ActionMenuItem } from "../ActionMenu";
import { DataTablePagination } from "../DataTablePagination";
import { DataToolbar, SearchField } from "../DataToolbar";
import { SelectInput } from "../FormControls";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../Table";
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
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const deferredSearchInput = useDeferredValue(searchInput.trim().toLowerCase());
  const visibleMembers = members.filter((member) => {
    if (!deferredSearchInput) {
      return true;
    }

    return [member.user.name, member.user.email ?? "", member.user.id, member.role]
      .join(" ")
      .toLowerCase()
      .includes(deferredSearchInput);
  });
  const pageCount = Math.max(1, Math.ceil(visibleMembers.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedMembers = visibleMembers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="mt-4 grid gap-4">
      <DataToolbar>
        <SearchField
          aria-label="Filtrar membros"
          onChange={(event) => {
            setSearchInput(event.target.value);
            setPage(1);
          }}
          placeholder="Filter by member, email or role..."
          value={searchInput}
        />
      </DataToolbar>
      <div className="overflow-hidden rounded-md border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Membro</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-10 text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedMembers.length > 0 ? (
              paginatedMembers.map((member) => (
                <MemberListRow
                  canRemoveMember={canRemoveMember}
                  disabled={disabled}
                  getAvailableRoles={getAvailableRoles}
                  key={member.id}
                  member={member}
                  onRemoveMember={onRemoveMember}
                  onRoleChange={onRoleChange}
                  roles={roles}
                />
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center text-muted-foreground" colSpan={4}>
                  {members.length === 0 ? emptyMessage : "Nenhum membro encontrado."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination
        onPageChange={setPage}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(1);
        }}
        page={currentPage}
        pageSize={pageSize}
        totalItems={visibleMembers.length}
      />
    </div>
  );
}

type MemberListRowProps = {
  disabled: boolean;
  getAvailableRoles?: (member: MemberListItem) => readonly string[];
  canRemoveMember?: (member: MemberListItem) => boolean;
  member: MemberListItem;
  onRemoveMember?: (memberId: string) => void;
  onRoleChange?: (memberId: string, role: string) => void;
  roles: readonly string[];
};

function MemberListRow({
  disabled,
  getAvailableRoles,
  canRemoveMember,
  member,
  onRemoveMember,
  onRoleChange,
  roles,
}: MemberListRowProps) {
  const roleOptions = getAvailableRoles?.(member) ?? roles;
  const canChangeRole = Boolean(onRoleChange && roleOptions.length > 0);
  const canRemove = canRemoveMember?.(member) ?? true;

  return (
    <TableRow className="text-foreground">
      <TableCell className="min-w-52">
        <strong className="block text-foreground">{member.user.name}</strong>
        <span className="block break-all font-mono text-xs text-muted-foreground">
          {member.user.id}
        </span>
      </TableCell>
      <TableCell className="max-w-64 whitespace-normal break-all">
        {member.user.email ?? "sem email"}
      </TableCell>
      <TableCell>
        {canChangeRole ? (
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
        )}
      </TableCell>
      <TableCell className="text-right">
        {onRemoveMember ? (
          <ActionMenu label={`Acoes para ${member.user.name}`}>
            <ActionMenuItem
              destructive
              disabled={disabled || !canRemove}
              onClick={() => onRemoveMember(member.id)}
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              Remover
            </ActionMenuItem>
          </ActionMenu>
        ) : null}
      </TableCell>
    </TableRow>
  );
}
