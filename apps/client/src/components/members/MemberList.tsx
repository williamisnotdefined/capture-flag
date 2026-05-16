import { Trash2 } from "lucide-react";
import { Button } from "../Button";
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
  return (
    <div className="mt-4 rounded-md border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Membro</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length > 0 ? (
            members.map((member) => (
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
            <TableRow className="hover:bg-transparent">
              <TableCell className="h-12 text-sm text-slate-500" colSpan={4}>
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
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
    <TableRow className="text-slate-800">
      <TableCell className="min-w-52">
        <strong className="block text-slate-900">{member.user.name}</strong>
        <span className="block break-all font-mono text-xs text-stone-600">{member.user.id}</span>
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
          <Button
            className="h-8 px-2"
            disabled={disabled || !canRemove}
            onClick={() => onRemoveMember(member.id)}
            type="button"
            variant="danger"
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
            Remover
          </Button>
        ) : null}
      </TableCell>
    </TableRow>
  );
}
