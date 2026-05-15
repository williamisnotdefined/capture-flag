import {
  useAddOrganizationMember,
  useGetOrganizationMembers,
  useRemoveOrganizationMember,
  useUpdateOrganizationMember,
} from "../../api/organizations";
import { MembersPanel } from "../../components";
import type { MemberListItem } from "../../components";
import { canManageOrganizationMembers } from "../../permissions";
import type { OrganizationRole } from "../../types";
import { useOrganizationRouteContext } from "../PlatformLayout/useRouteContext";
import { adminOrganizationRoles, ownerOrganizationRoles } from "./roles";

export function OrganizationMembersSection() {
  const { organizationRole: actorOrganizationRole, selectedOrganizationId } =
    useOrganizationRouteContext();
  const organizationMembersQuery = useGetOrganizationMembers(selectedOrganizationId);
  const addOrganizationMemberMutation = useAddOrganizationMember(selectedOrganizationId);
  const updateOrganizationMemberMutation = useUpdateOrganizationMember(selectedOrganizationId);
  const removeOrganizationMemberMutation = useRemoveOrganizationMember(selectedOrganizationId);
  const members = organizationMembersQuery.data ?? [];
  const isOrganizationAdmin = canManageOrganizationMembers(actorOrganizationRole);
  const roles = actorOrganizationRole === "owner" ? ownerOrganizationRoles : adminOrganizationRoles;
  const ownerCount = members.filter((member) => member.role === "owner").length;

  function availableRolesFor(member: MemberListItem) {
    if (!isOrganizationAdmin) {
      return [];
    }

    if (actorOrganizationRole === "admin" && member.role === "owner") {
      return [];
    }

    if (member.role === "owner" && ownerCount <= 1) {
      return ["owner"] as const;
    }

    return roles;
  }

  function canRemoveMember(member: MemberListItem) {
    if (!isOrganizationAdmin) {
      return false;
    }

    if (actorOrganizationRole === "admin" && member.role === "owner") {
      return false;
    }

    return !(member.role === "owner" && ownerCount <= 1);
  }

  return (
    <MembersPanel
      addError={addOrganizationMemberMutation.error}
      disabled={!selectedOrganizationId || !isOrganizationAdmin}
      emptyMessage="Sem membros"
      getAvailableRoles={availableRolesFor}
      canRemoveMember={canRemoveMember}
      isManagingMembers={
        updateOrganizationMemberMutation.isPending || removeOrganizationMemberMutation.isPending
      }
      isPending={addOrganizationMemberMutation.isPending}
      managementError={
        updateOrganizationMemberMutation.error ?? removeOrganizationMemberMutation.error
      }
      members={members}
      onRemoveMember={(memberId) => removeOrganizationMemberMutation.mutate({ memberId })}
      onRoleChange={(memberId, role) =>
        updateOrganizationMemberMutation.mutate({ memberId, role: role as OrganizationRole })
      }
      onSubmit={addOrganizationMemberMutation.mutateAsync}
      permissionHint={
        !isOrganizationAdmin ? "Somente owner ou admin pode gerenciar membros." : undefined
      }
      queryError={organizationMembersQuery.error}
      roles={roles}
      title="Membros da organizacao"
    />
  );
}
