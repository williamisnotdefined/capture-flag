import {
  useAddProjectMember,
  useGetProjectMembers,
  useRemoveProjectMember,
  useUpdateProjectMember,
} from "../../api/projects";
import { MembersPanel } from "../_shared/members/MembersPanel";
import { projectRoles } from "./roles";

type ProjectMembersSectionProps = {
  canManageProjectMembers: boolean;
  selectedProjectId: string;
};

export function ProjectMembersSection({
  canManageProjectMembers,
  selectedProjectId,
}: ProjectMembersSectionProps) {
  const projectMembersQuery = useGetProjectMembers(selectedProjectId);
  const addProjectMemberMutation = useAddProjectMember(selectedProjectId);
  const updateProjectMemberMutation = useUpdateProjectMember(selectedProjectId);
  const removeProjectMemberMutation = useRemoveProjectMember(selectedProjectId);

  return (
    <MembersPanel
      addError={addProjectMemberMutation.error}
      disabled={!selectedProjectId || !canManageProjectMembers}
      emptyMessage="Sem membros no projeto"
      isManagingMembers={
        updateProjectMemberMutation.isPending || removeProjectMemberMutation.isPending
      }
      isPending={addProjectMemberMutation.isPending}
      managementError={updateProjectMemberMutation.error ?? removeProjectMemberMutation.error}
      members={projectMembersQuery.data ?? []}
      onRemoveMember={(memberId) => removeProjectMemberMutation.mutate({ memberId })}
      onRoleChange={(memberId, role) => updateProjectMemberMutation.mutate({ memberId, role })}
      onSubmit={addProjectMemberMutation.mutateAsync}
      permissionHint={
        !canManageProjectMembers
          ? "Somente owner, admin ou project_admin pode conceder roles por projeto."
          : undefined
      }
      queryError={projectMembersQuery.error}
      roles={projectRoles}
      title="Membros do projeto"
    />
  );
}
