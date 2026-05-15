import { Button } from "../Button";
import { SelectInput } from "../FormControls";
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
  if (members.length === 0) {
    return <p className="mt-4 text-sm text-stone-600">{emptyMessage}</p>;
  }

  return (
    <div className="mt-4 grid gap-3">
      {members.map((member) => (
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
      ))}
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
    <div className="grid gap-3 rounded-2xl bg-[#f4f0e8] p-4 text-sm text-slate-800 lg:grid-cols-[1fr_auto_auto] lg:items-center">
      <div>
        <strong className="block text-slate-900">{member.user.name}</strong>
        <span className="block">{member.user.email ?? member.user.id}</span>
      </div>
      {canChangeRole ? (
        <SelectInput
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
      {onRemoveMember ? (
        <Button
          disabled={disabled || !canRemove}
          onClick={() => onRemoveMember(member.id)}
          type="button"
          variant="danger"
        >
          Remover
        </Button>
      ) : null}
    </div>
  );
}
