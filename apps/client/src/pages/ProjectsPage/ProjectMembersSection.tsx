import {
  useAddProjectMember,
  useGetProjectMembers,
  useRemoveProjectMember,
  useUpdateProjectMember,
} from "../../api/projects";
import { useGetOrganizationMembers } from "../../api/organizations";
import { MembersPanel } from "../../components";
import type { MemberTargetOption } from "../../components";
import { useProjectRouteContext } from "../../layouts/PlatformLayout/useRouteContext";
import { canManageProjectResources } from "../../permissions";
import { projectRoles } from "./roles";

export function ProjectMembersSection() {
  const { organizationRole, selectedOrganizationId, selectedProject, selectedProjectId } =
    useProjectRouteContext();
  const canManageProjectMembers = canManageProjectResources(
    organizationRole,
    selectedProject?.currentUserProjectRole ?? null,
  );
  const projectMembersQuery = useGetProjectMembers(selectedProjectId);
  const organizationMembersQuery = useGetOrganizationMembers(selectedOrganizationId);
  const addProjectMemberMutation = useAddProjectMember(selectedProjectId);
  const updateProjectMemberMutation = useUpdateProjectMember(selectedProjectId);
  const removeProjectMemberMutation = useRemoveProjectMember(selectedProjectId);
  const projectMembers = projectMembersQuery.data ?? [];
  const isLoadingMemberTargets = projectMembersQuery.isFetching || organizationMembersQuery.isFetching;
  const existingProjectUserIds = new Set(projectMembers.map((member) => member.user.id));
  const memberTargetOptions: MemberTargetOption[] = (organizationMembersQuery.data ?? [])
    .filter((member) => !existingProjectUserIds.has(member.user.id))
    .map((member) => ({
      description: member.user.email ?? undefined,
      label: member.user.name,
      value: member.user.id,
    }));

  return (
    <MembersPanel
      addError={addProjectMemberMutation.error}
      disabled={!selectedProjectId || !canManageProjectMembers || isLoadingMemberTargets}
      emptyMessage="Sem membros no projeto"
      isManagingMembers={
        updateProjectMemberMutation.isPending || removeProjectMemberMutation.isPending
      }
      isPending={addProjectMemberMutation.isPending}
      managementError={updateProjectMemberMutation.error ?? removeProjectMemberMutation.error}
      members={projectMembers}
      onRemoveMember={(memberId) => removeProjectMemberMutation.mutate({ memberId })}
      onRoleChange={(memberId, role) => updateProjectMemberMutation.mutate({ memberId, role })}
      onSubmit={addProjectMemberMutation.mutateAsync}
      permissionHint={
        !canManageProjectMembers
          ? "Somente owner, admin ou project_admin pode conceder roles por projeto."
          : undefined
      }
      queryError={projectMembersQuery.error ?? organizationMembersQuery.error}
      roles={projectRoles}
      targetOptions={memberTargetOptions}
      targetPlaceholder={
        memberTargetOptions.length > 0
          ? "Selecione um membro da organizacao"
          : "Sem membros da organizacao disponiveis"
      }
      title="Membros do projeto"
    />
  );
}
