import { useAddOrganizationMember, useGetOrganizationMembers } from "../../../api/organizations";
import { MembersPanel } from "../members/MembersPanel";

type OrganizationMembersSectionProps = {
  isOrganizationAdmin: boolean;
  roles: string[];
  selectedOrganizationId: string;
};

export function OrganizationMembersSection({
  isOrganizationAdmin,
  roles,
  selectedOrganizationId,
}: OrganizationMembersSectionProps) {
  const organizationMembersQuery = useGetOrganizationMembers(selectedOrganizationId);
  const addOrganizationMemberMutation = useAddOrganizationMember(selectedOrganizationId);

  return (
    <MembersPanel
      addError={addOrganizationMemberMutation.error}
      disabled={!selectedOrganizationId || !isOrganizationAdmin}
      emptyMessage="Sem membros"
      isPending={addOrganizationMemberMutation.isPending}
      members={organizationMembersQuery.data ?? []}
      onSubmit={addOrganizationMemberMutation.mutateAsync}
      permissionHint={
        !isOrganizationAdmin ? "Somente owner ou admin pode adicionar membros." : undefined
      }
      queryError={organizationMembersQuery.error}
      roles={roles}
      title="Membros da organizacao"
    />
  );
}
