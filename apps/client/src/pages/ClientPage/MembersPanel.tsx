import { Panel } from "../../components/Panel";
import { ErrorMessage, PermissionHint } from "../../components/ui";
import { MemberForm } from "./MemberForm";
import { MemberList } from "./MemberList";
import type { MemberFormValues } from "./types";

type MembersPanelProps = {
  addError: unknown;
  disabled: boolean;
  emptyMessage: string;
  isPending: boolean;
  members: Parameters<typeof MemberList>[0]["members"];
  onSubmit: (values: MemberFormValues) => Promise<unknown>;
  permissionHint?: string;
  queryError: unknown;
  roles: string[];
  title: string;
};

export function MembersPanel({
  addError,
  disabled,
  emptyMessage,
  isPending,
  members,
  onSubmit,
  permissionHint,
  queryError,
  roles,
  title,
}: MembersPanelProps) {
  return (
    <Panel title={title}>
      <MemberForm disabled={disabled} isPending={isPending} onSubmit={onSubmit} roles={roles} />
      {permissionHint ? <PermissionHint>{permissionHint}</PermissionHint> : null}
      <ErrorMessage error={queryError} />
      <ErrorMessage error={addError} />
      <MemberList emptyMessage={emptyMessage} members={members} />
    </Panel>
  );
}
