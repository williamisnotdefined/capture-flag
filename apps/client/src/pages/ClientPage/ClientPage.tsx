import { Navigate, useNavigate } from "react-router-dom";
import { useGetMe, useLogout } from "../../api/auth";
import { Shell } from "../../components/Shell";
import { OrganizationMembersSection } from "./organizations/OrganizationMembersSection";
import { OrganizationPanel } from "./organizations/OrganizationPanel";
import { useOrganizationSelection } from "./organizations/useOrganizationSelection";
import { canManageOrganizationMembers } from "./permissions";
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
  const organizationRole = selectedOrganization?.role ?? null;
  const isOrganizationAdmin = canManageOrganizationMembers(organizationRole);

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
          actorOrganizationRole={organizationRole}
          selectedOrganizationId={selectedOrganizationId}
        />

        <ProjectWorkspace
          key={selectedOrganizationId}
          organizationRole={organizationRole}
          selectedOrganizationId={selectedOrganizationId}
        />
      </main>
    </Shell>
  );
}
