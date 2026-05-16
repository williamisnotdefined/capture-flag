import { useOrganizationRouteContext } from "../../layouts/PlatformLayout/useRouteContext";
import { OrganizationMembersSection } from "./OrganizationMembersSection";
import { OrganizationPanel } from "./OrganizationPanel";

export function OrganizationEditPage() {
  const { selectedOrganization } = useOrganizationRouteContext();

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <OrganizationPanel />
      {selectedOrganization ? <OrganizationMembersSection /> : null}
    </div>
  );
}
