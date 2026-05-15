import { useNavigate } from "react-router-dom";
import { organizationPath } from "../PlatformLayout/routePaths";
import { useOrganizationRouteContext } from "../PlatformLayout/useRouteContext";
import { PageHeader } from "../_shared/PageHeader";
import { OrganizationMembersSection } from "./OrganizationMembersSection";
import { OrganizationPanel } from "./OrganizationPanel";

export function OrganizationsPage() {
  const navigate = useNavigate();
  const { organizationRole, organizations, selectedOrganizationId } = useOrganizationRouteContext();

  return (
    <>
      <PageHeader
        description="Escolha a organizacao ativa, crie novos tenants e gerencie os usuarios globais daquela organizacao."
        eyebrow="Tenant"
        title="Organizacoes"
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <OrganizationPanel
          onCreated={(organization) => navigate(organizationPath(organization.id))}
          onSelect={(organizationId) => navigate(organizationPath(organizationId))}
          organizations={organizations}
          selectedOrganizationId={selectedOrganizationId}
        />
        <OrganizationMembersSection
          actorOrganizationRole={organizationRole}
          selectedOrganizationId={selectedOrganizationId}
        />
      </div>
    </>
  );
}
