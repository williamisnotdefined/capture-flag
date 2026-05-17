import { ErrorMessage } from "@components/ErrorMessage";
import { Panel } from "@components/Panel";
import { PermissionHint } from "@components/PermissionHint";
import { MemberForm } from "./MemberForm";
import { MemberList } from "./MemberList";
import type { MemberFormValues, MemberListItem, MemberTargetOption } from "./types";

type MembersPanelProps = {
  addError: unknown;
  disabled: boolean;
  emptyMessage: string;
  managementError?: unknown;
  getAvailableRoles?: (member: MemberListItem) => readonly string[];
  canRemoveMember?: (member: MemberListItem) => boolean;
  isPending: boolean;
  isManagingMembers?: boolean;
  members: MemberListItem[];
  onBulkRemoveMembers?: (memberIds: string[]) => void;
  onRemoveMember?: (memberId: string) => void;
  onRoleChange?: (memberId: string, role: string) => void;
  onSubmit: (values: MemberFormValues) => Promise<unknown>;
  permissionHint?: string;
  queryError: unknown;
  roles: readonly string[];
  targetOptions?: readonly MemberTargetOption[];
  targetPlaceholder?: string;
  title: string;
};

export function MembersPanel({
  addError,
  disabled,
  emptyMessage,
  managementError,
  getAvailableRoles,
  canRemoveMember,
  isPending,
  isManagingMembers = false,
  members,
  onBulkRemoveMembers,
  onRemoveMember,
  onRoleChange,
  onSubmit,
  permissionHint,
  queryError,
  roles,
  targetOptions,
  targetPlaceholder,
  title,
}: MembersPanelProps) {
  return (
    <Panel title={title}>
      <MemberForm
        disabled={disabled}
        isPending={isPending}
        onSubmit={onSubmit}
        roles={roles}
        targetOptions={targetOptions}
        targetPlaceholder={targetPlaceholder}
      />
      {permissionHint ? <PermissionHint>{permissionHint}</PermissionHint> : null}
      <ErrorMessage error={queryError} />
      <ErrorMessage error={addError} />
      <ErrorMessage error={managementError} />
      <MemberList
        disabled={disabled || isManagingMembers}
        emptyMessage={emptyMessage}
        getAvailableRoles={getAvailableRoles}
        canRemoveMember={canRemoveMember}
        members={members}
        onBulkRemoveMembers={onBulkRemoveMembers}
        onRemoveMember={onRemoveMember}
        onRoleChange={onRoleChange}
        roles={roles}
      />
    </Panel>
  );
}
