import { Navigate, useNavigate } from "react-router-dom";
import { useGetMe, useLogout } from "../../api/auth";
import { Shell } from "../../components/Shell";
import { OrganizationMembersSection } from "./organizations/OrganizationMembersSection";
import { OrganizationPanel } from "./organizations/OrganizationPanel";
import { adminOrganizationRoles, ownerOrganizationRoles } from "./organizations/roles";
import { useOrganizationSelection } from "./organizations/useOrganizationSelection";
import { ProjectWorkspace } from "./projects/ProjectWorkspace";
import { SessionHeader } from "./session/SessionHeader";

export function ClientPage() {
  const navigate = useNavigate();
  const meQuery = useGetMe();
  const organizations = meQuery.data?.organizations ?? [];
  const {
    resetOrganizationSelection,
    selectCreatedOrganization,
    selectOrganizationId,
    selectedOrganization,
    selectedOrganizationId,
  } = useOrganizationSelection(organizations);
  const isOrganizationAdmin = ["owner", "admin"].includes(selectedOrganization?.role ?? "");
  const organizationRoleOptions =
    selectedOrganization?.role === "owner" ? ownerOrganizationRoles : adminOrganizationRoles;

  const logoutMutation = useLogout({
    onSuccess: () => {
      resetOrganizationSelection();
      navigate("/login");
    },
  });

  if (meQuery.isLoading) {
    return <Shell title="Capture Flag">Carregando sessao...</Shell>;
  }

  if (meQuery.isError) {
    return <Navigate to="/login" replace />;
  }

  const me = meQuery.data;
  if (!me) {
    return <Shell title="Capture Flag">Sessao indisponivel.</Shell>;
  }

  return (
    <Shell title="Capture Flag">
      <SessionHeader
        isLogoutPending={logoutMutation.isPending}
        onLogout={() => logoutMutation.mutate()}
        user={me.user}
      />

      <main className="grid gap-4 lg:grid-cols-2">
        <OrganizationPanel
          onCreated={selectCreatedOrganization}
          onSelect={selectOrganizationId}
          organizations={organizations}
          selectedOrganizationId={selectedOrganizationId}
        />

        <OrganizationMembersSection
          isOrganizationAdmin={isOrganizationAdmin}
          roles={organizationRoleOptions}
          selectedOrganizationId={selectedOrganizationId}
        />

        <ProjectWorkspace
          key={selectedOrganizationId}
          isOrganizationAdmin={isOrganizationAdmin}
          selectedOrganizationId={selectedOrganizationId}
        />
      </main>
    </Shell>
  );
}
