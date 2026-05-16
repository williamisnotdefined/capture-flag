import { PageLayout } from "../../components";
import { useOrganizationRouteContext } from "../../routing/useRouteContext";
import { OrganizationMembersSection } from "./OrganizationMembersSection";
import { OrganizationPanel } from "./OrganizationPanel";

export function OrganizationEditPage() {
  const { selectedOrganization } = useOrganizationRouteContext();

  return (
    <PageLayout
      contentClassName="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
      description="Edite dados da organizacao e gerencie membros do tenant."
      eyebrow="Workspace"
      title={selectedOrganization ? selectedOrganization.name : "Organizacao"}
    >
      <OrganizationPanel />
      {selectedOrganization ? <OrganizationMembersSection /> : null}
    </PageLayout>
  );
}
