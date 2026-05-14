import { Button, SelectInput } from "../../../components";
import type { UserSummary } from "../../../types";

type MemberListItem = {
  id: string;
  role: string;
  user: UserSummary;
};

type MemberListProps = {
  disabled?: boolean;
  emptyMessage: string;
  members: MemberListItem[];
  onRemoveMember?: (memberId: string) => void;
  onRoleChange?: (memberId: string, role: string) => void;
  roles?: string[];
};

export function MemberList({
  disabled = false,
  emptyMessage,
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
        <div
          className="grid gap-3 rounded-2xl bg-[#f4f0e8] p-4 text-sm text-slate-800 lg:grid-cols-[1fr_auto_auto] lg:items-center"
          key={member.id}
        >
          <div>
            <strong className="block text-slate-900">{member.user.name}</strong>
            <span className="block">{member.user.email ?? member.user.id}</span>
          </div>
          {onRoleChange ? (
            <SelectInput
              disabled={disabled}
              onChange={(event) => onRoleChange(member.id, event.target.value)}
              value={member.role}
            >
              {roles.map((role) => (
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
              disabled={disabled}
              onClick={() => onRemoveMember(member.id)}
              type="button"
              variant="danger"
            >
              Remover
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
