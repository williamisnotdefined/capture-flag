import { useAddProjectMember, useGetProjectMembers } from "../../../api/projects";
import { MembersPanel } from "../members/MembersPanel";
import { projectRoles } from "./roles";

type ProjectMembersSectionProps = {
  isOrganizationAdmin: boolean;
  selectedProjectId: string;
};

export function ProjectMembersSection({
  isOrganizationAdmin,
  selectedProjectId,
}: ProjectMembersSectionProps) {
  const projectMembersQuery = useGetProjectMembers(selectedProjectId);
  const addProjectMemberMutation = useAddProjectMember(selectedProjectId);

  return (
    <MembersPanel
      addError={addProjectMemberMutation.error}
      disabled={!selectedProjectId || !isOrganizationAdmin}
      emptyMessage="Sem membros no projeto"
      isPending={addProjectMemberMutation.isPending}
      members={projectMembersQuery.data ?? []}
      onSubmit={addProjectMemberMutation.mutateAsync}
      permissionHint={
        !isOrganizationAdmin ? "Somente owner ou admin pode conceder roles por projeto." : undefined
      }
      queryError={projectMembersQuery.error}
      roles={projectRoles}
      title="Membros do projeto"
    />
  );
}
